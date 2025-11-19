import io
import os
import uuid
from PIL import Image
from typing import Annotated, Optional, List
from datetime import datetime, timezone
import shutil
import certifi
import numpy as np
import cv2 # <-- ADDED THIS IMPORT
from difflib import SequenceMatcher

import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from torchvision import models, transforms
from torchvision.models import ResNet50_Weights
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from jose import JWTError, jwt

# --- MongoDB Imports ---
import motor.motor_asyncio
import security

# -------------------
# 1. MongoDB Atlas Setup
# -------------------

MONGO_DETAILS = "mongodb+srv://likithkumar1si22ci024_db_user:6JsatsXEC1nGJ6kn@cluster0.wwotw1c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGO_DETAILS,
    tls=True,
    tlsCAFile=certifi.where()
)
db = client.alzAwareDB

user_collection = db.get_collection("users")
assessment_collection = db.get_collection("assessments")
cognitive_test_collection = db.get_collection("cognitive_tests")
audio_recall_collection = db.get_collection("audio_recall_tests")
notification_collection = db.get_collection("notifications")
messages_collection = db.get_collection("messages")

# -------------------
# 2. Pydantic Schemas
# -------------------

class ProfessionalDetailItem(BaseModel):
    title: str
    description: str

class DoctorProfessionalDetails(BaseModel):
    education: List[ProfessionalDetailItem] = []
    career_history: List[ProfessionalDetailItem] = []
    specializations: List[str] = []
    professional_experience: str = ""
    success_stories: List[ProfessionalDetailItem] = []

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    age: int
    role: str # 'patient' or 'doctor'

class UserPublic(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    full_name: str
    age: int
    role: str
    profile_photo_url: Optional[str] = None
    assigned_patients: Optional[List[str]] = None
    assigned_doctor: Optional[str] = None
    doctor_requests: Optional[List[dict]] = None
    pending_patients: Optional[List[dict]] = None
    professional_details: Optional[DoctorProfessionalDetails] = None

class AssessmentCreate(BaseModel):
    prediction: str
    confidence: float

class AssessmentPublic(BaseModel):
    id: str = Field(alias="_id")
    prediction: str
    confidence: float
    created_at: datetime
    owner_email: str

class HighRiskAssessmentPublic(AssessmentPublic):
    patient_full_name: str

class CognitiveTestResultCreate(BaseModel):
    test_type: str
    score: int
    total_questions: int
    memory_score: Optional[int] = None
    attention_score: Optional[int] = None
    processing_speed: Optional[int] = None
    executive_score: Optional[int] = None

class CognitiveTestResultPublic(BaseModel):
    id: str = Field(alias="_id")
    test_type: str
    score: int
    total_questions: int
    created_at: datetime
    owner_email: str
    memory_score: Optional[int] = None
    attention_score: Optional[int] = None
    processing_speed: Optional[int] = None
    executive_score: Optional[int] = None

# --- Audio Recall Test Schemas ---
class TextComparisonRequest(BaseModel):
    original: str
    spoken: str

class TextComparisonResponse(BaseModel):
    similarityScore: float

class AudioRecallRoundDetail(BaseModel):
    round: int
    originalText: str
    spokenText: str
    similarityScore: float
    correct: bool

class AudioRecallTestCreate(BaseModel):
    test_type: str
    score: int
    total_questions: int
    average_similarity: float
    correct_recalls: int
    total_rounds: int
    round_details: List[AudioRecallRoundDetail]

class AudioRecallTestPublic(BaseModel):
    id: str = Field(alias="_id")
    test_type: str
    score: int
    total_questions: int
    average_similarity: float
    correct_recalls: int
    total_rounds: int
    round_details: List[AudioRecallRoundDetail]
    created_at: datetime
    owner_email: str
    
class TokenData(BaseModel): 
    access_token: str
    token_type: str
    user: UserPublic

class AssignPatientRequest(BaseModel):
    patient_email: EmailStr

class AssignDoctorRequest(BaseModel):
    doctor_email: EmailStr

# --- Doctor Request Schemas ---
class DoctorRequest(BaseModel):
    doctor_id: str
    doctor_email: str
    doctor_name: str
    status: str  # 'pending', 'approved', 'rejected'
    requested_at: datetime

class DoctorRequestPublic(BaseModel):
    doctor_id: str
    doctor_email: str
    doctor_name: str
    status: str
    requested_at: datetime

class PatientRequest(BaseModel):
    patient_id: str
    patient_email: str
    patient_name: str
    status: str  # 'pending', 'approved', 'rejected'
    requested_at: datetime

class PatientRequestPublic(BaseModel):
    patient_id: str
    patient_email: str
    patient_name: str
    status: str
    requested_at: datetime

class RespondToRequestRequest(BaseModel):
    patient_email: EmailStr
    action: str  # 'approve' or 'reject'

# --- Notification Schemas ---
class NotificationCreate(BaseModel):
    user_email: EmailStr
    message: str
    type: str
    status: str = "unread"
    timestamp: datetime

class NotificationPublic(BaseModel):
    id: str = Field(alias="_id")
    user_email: str
    message: str
    type: str
    status: str
    timestamp: datetime

    class Config:
        populate_by_name = True

# --- Schemas for the Doctor Dashboard ---
class PatientSummary(UserPublic):
    last_mri_result: Optional[AssessmentPublic] = None
    last_cognitive_score: Optional[CognitiveTestResultPublic] = None

class DoctorDashboardData(BaseModel):
    total_patients: int
    high_risk_cases_count: int
    my_patients_summary: List[PatientSummary]
    high_risk_patients: List[HighRiskAssessmentPublic]

# --- Chat/Message Schemas ---
class MessageCreate(BaseModel):
    receiver_email: EmailStr
    message: str

class MessagePublic(BaseModel):
    id: str = Field(alias="_id")
    sender_email: str
    receiver_email: str
    message: str
    timestamp: datetime
    read: bool = False

    class Config:
        populate_by_name = True

# -------------------
# 3. Authentication Setup
# -------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

async def require_doctor(current_user: Annotated[dict, Depends(get_current_user)]):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this resource")
    return current_user

# -------------------
# 4. App & Middleware Setup
# -------------------

app = FastAPI(title="AlzAware API")

os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/heatmaps", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------
# 5. AI Model Loading
# -------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
ckpt_path = "best_model.pth"
if not os.path.exists(ckpt_path):
    raise FileNotFoundError(f"Model checkpoint not found at: {ckpt_path}.")
ckpt = torch.load(ckpt_path, map_location=device)
class_names = ckpt["class_names"]
weights = ResNet50_Weights.IMAGENET1K_V2
model = models.resnet50(weights=weights)
in_features = model.fc.in_features
model.fc = nn.Sequential(nn.Linear(in_features, 512), nn.ReLU(inplace=True), nn.Dropout(0.5), nn.Linear(512, len(class_names)))
model.load_state_dict(ckpt["model_state"])
model = model.to(device)
model.eval()
eval_transforms = transforms.Compose([transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(), transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])

print("[INFO] Model loaded and ready.")
print("[INFO] Connected to MongoDB Atlas.")

# -------------------
# 5b. Grad-CAM Helper Function
# -------------------

def generate_gradcam_heatmap(model, img_tensor, target_class):
    """
    Generate Grad-CAM heatmap for the given image tensor.
    
    Args:
        model: The ResNet50 model
        img_tensor: Input image tensor (1, 3, 224, 224)
        target_class: Index of the predicted class
    
    Returns:
        heatmap: Numpy array of the heatmap (0-255)
    """
    # Get the last convolutional layer (layer4 in ResNet50)
    target_layer = model.layer4[-1]
    
    # Hook to capture feature maps and gradients
    feature_maps = []
    gradients = []
    
    def forward_hook(module, input, output):
        feature_maps.append(output)
    
    def backward_hook(module, grad_input, grad_output):
        gradients.append(grad_output[0])
    
    # Register hooks
    forward_handle = target_layer.register_forward_hook(forward_hook)
    backward_handle = target_layer.register_full_backward_hook(backward_hook)
    
    # Forward pass
    model.zero_grad()
    output = model(img_tensor)
    
    # Backward pass for the target class
    target = output[0, target_class]
    target.backward()
    
    # Remove hooks
    forward_handle.remove()
    backward_handle.remove()
    
    # Get feature maps and gradients
    feature_map = feature_maps[0].cpu().detach().numpy()[0]  # (2048, 7, 7)
    gradient = gradients[0].cpu().detach().numpy()[0]  # (2048, 7, 7)
    
    # Global average pooling of gradients
    weights = np.mean(gradient, axis=(1, 2))  # (2048,)
    
    # Weighted combination of feature maps
    cam = np.zeros(feature_map.shape[1:], dtype=np.float32)  # (7, 7)
    for i, w in enumerate(weights):
        cam += w * feature_map[i]
    
    # Apply ReLU to cam
    cam = np.maximum(cam, 0)
    
    # Normalize to 0-1
    if cam.max() > 0:
        cam = cam / cam.max()
    
    # Resize to 224x224
    cam_resized = cv2.resize(cam, (224, 224))
    
    # Convert to 0-255
    heatmap = np.uint8(255 * cam_resized)
    
    return heatmap


def create_heatmap_overlay(original_img, heatmap):
    """
    Create an overlay of the heatmap on the original image.
    
    Args:
        original_img: PIL Image object (grayscale or RGB)
        heatmap: Numpy array (224, 224) with values 0-255
    
    Returns:
        overlay: PIL Image object of the blended result
    """
    # Resize original image to 224x224
    img_resized = original_img.resize((224, 224))
    img_array = np.array(img_resized)
    
    # Convert grayscale to RGB if needed
    if len(img_array.shape) == 2:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_GRAY2RGB)
    elif img_array.shape[2] == 4:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
    
    # Apply colormap to heatmap (JET colormap)
    heatmap_colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    # Blend the heatmap with the original image
    alpha = 0.4  # Transparency factor
    overlay = cv2.addWeighted(img_array, 1 - alpha, heatmap_colored, alpha, 0)
    
    # Convert back to PIL Image
    overlay_pil = Image.fromarray(overlay)
    
    return overlay_pil

# -------------------
# 6. API Endpoints
# -------------------

@app.get("/")
def read_root():
    return {"message": "Welcome to the AlzAware Prediction API!"}

# --- User Endpoints ---
@app.post("/users/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    db_user = await user_collection.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if user.role not in ["patient", "doctor"]:
        raise HTTPException(status_code=400, detail="Role must be 'patient' or 'doctor'")
    hashed_password = security.hash_password(user.password)
    user_data = {
        "email": user.email, "hashed_password": hashed_password,
        "full_name": user.full_name, "age": user.age, 
        "role": user.role,
        "profile_photo_url": None,
    }
    if user.role == "doctor":
        user_data["assigned_patients"] = []
        user_data["pending_patients"] = []
        user_data["professional_details"] = DoctorProfessionalDetails().model_dump()
    elif user.role == "patient":
        user_data["assigned_doctor"] = None
        user_data["doctor_requests"] = []
    new_user = await user_collection.insert_one(user_data)
    created_user_doc = await user_collection.find_one({"_id": new_user.inserted_id})
    created_user_doc["_id"] = str(created_user_doc["_id"])
    return UserPublic.model_validate(created_user_doc)

@app.post("/token", response_model=TokenData) 
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user_doc = await user_collection.find_one({"email": form_data.username})
    if not user_doc or not security.verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if "role" not in user_doc:
        user_doc["role"] = "patient"
    user_doc["_id"] = str(user_doc["_id"])
    user_public = UserPublic.model_validate(user_doc)
    access_token = security.create_access_token(data={"sub": user_public.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_public 
    }
    
@app.get("/users/me", response_model=UserPublic)
async def read_users_me(current_user: Annotated[dict, Depends(get_current_user)]):
    current_user["_id"] = str(current_user["_id"])
    return UserPublic.model_validate(current_user)

@app.put("/users/me/photo", response_model=UserPublic)
async def upload_profile_photo(current_user: Annotated[dict, Depends(get_current_user)], file: UploadFile = File(...)):
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{current_user['_id']}{file_extension}"
    file_path = os.path.join("uploads", unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    photo_url = f"http://127.0.0.1:8000/uploads/{unique_filename}"
    await user_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile_photo_url": photo_url}}
    )
    updated_user_doc = await user_collection.find_one({"_id": current_user["_id"]})
    updated_user_doc["_id"] = str(updated_user_doc["_id"])
    return UserPublic.model_validate(updated_user_doc)

@app.put("/users/me/professional-details", response_model=UserPublic)
async def update_professional_details(
    details: DoctorProfessionalDetails,
    current_user: Annotated[dict, Depends(require_doctor)]
):
    await user_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"professional_details": details.model_dump()}}
    )
    updated_user_doc = await user_collection.find_one({"_id": current_user["_id"]})
    updated_user_doc["_id"] = str(updated_user_doc["_id"])
    return UserPublic.model_validate(updated_user_doc)


# --- HELPER FUNCTION FOR IMAGE VALIDATION (NEW) ---
def is_brain_mri_shape(img_bytes: bytes, aspect_ratio_min=0.75, aspect_ratio_max=1.3) -> bool:
    """
    Checks if the main object in an image has an aspect ratio typical of a brain MRI.
    Returns True if the shape is plausible, False otherwise.
    """
    try:
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        # Threshold to create a binary mask and find contours
        _, thresh = cv2.threshold(img, 30, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return False # No object found

        # Find the largest contour (the brain/skull) and its bounding box
        largest_contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)

        if h == 0 or w == 0:
            return False

        # Calculate the aspect ratio (width / height)
        aspect_ratio = w / h
        
        # Check if the ratio is within the expected range for a brain scan
        return aspect_ratio_min < aspect_ratio < aspect_ratio_max
    except Exception:
        # If any error occurs during processing, assume it's not a valid image
        return False


# --- AI Prediction Endpoint (UPDATED) ---
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()

    # --- Step 1: Validate the shape of the image FIRST ---
    if not is_brain_mri_shape(contents):
        raise HTTPException(
            status_code=400,
            detail="Invalid image shape. Please upload a proper brain MRI scan."
        )

    # --- Step 2: If shape is valid, proceed with prediction ---
    img = Image.open(io.BytesIO(contents))
    
    # Check for grayscale (this is still a good check to keep)
    img_array = np.array(img)
    is_grayscale = len(img_array.shape) == 2 or (len(img_array.shape) == 3 and np.all(img_array[:,:,0] == img_array[:,:,1]))
    if not is_grayscale:
        raise HTTPException(status_code=400, detail="Incorrect image type. Please upload a grayscale MRI scan.")

    # Convert to RGB and run through the Alzheimer's model
    img_rgb = img.convert("RGB")
    img_tensor = eval_transforms(img_rgb).unsqueeze(0).to(device)
    
    with torch.no_grad():
        logits = model(img_tensor)
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        pred_idx = int(probs.argmax())
        pred_class = class_names[pred_idx]
        confidence = float(probs[pred_idx])

    # --- Step 3: Generate Grad-CAM heatmap ---
    try:
        print("[INFO] Generating Grad-CAM heatmap...")
        
        # Create a new tensor that requires gradient
        img_tensor_grad = eval_transforms(img_rgb).unsqueeze(0).to(device)
        img_tensor_grad.requires_grad = True
        
        # Generate heatmap
        heatmap = generate_gradcam_heatmap(model, img_tensor_grad, pred_idx)
        
        # Create overlay image
        overlay_img = create_heatmap_overlay(img, heatmap)
        
        # Save the overlay image with unique filename
        unique_id = str(uuid.uuid4())
        heatmap_filename = f"heatmap_{unique_id}.png"
        heatmap_path = os.path.join("uploads", "heatmaps", heatmap_filename)
        overlay_img.save(heatmap_path)
        
        # Generate public URL
        heatmap_url = f"http://127.0.0.1:8000/uploads/heatmaps/{heatmap_filename}"
        
        print(f"[INFO] Heatmap saved to: {heatmap_path}")
        
    except Exception as e:
        print(f"[ERROR] Failed to generate heatmap: {str(e)}")
        heatmap_url = None

    return {
        "prediction": pred_class,
        "confidence": confidence,
        "class_probabilities": {class_names[i]: f"{float(probs[i]):.2%}" for i in range(len(probs))},
        "heatmap_url": heatmap_url
    }


# --- Assessment Endpoints ---
@app.post("/assessments/", response_model=AssessmentPublic)
async def create_assessment(assessment: AssessmentCreate, current_user: Annotated[dict, Depends(get_current_user)]):
    assessment_data = assessment.model_dump()
    assessment_data["owner_email"] = current_user["email"]
    assessment_data["created_at"] = datetime.now(timezone.utc)
    new_assessment = await assessment_collection.insert_one(assessment_data)
    created_assessment_doc = await assessment_collection.find_one({"_id": new_assessment.inserted_id})
    created_assessment_doc["_id"] = str(created_assessment_doc["_id"])
    return AssessmentPublic.model_validate(created_assessment_doc)

@app.get("/assessments/", response_model=List[AssessmentPublic])
async def get_my_assessments(
    current_user: Annotated[dict, Depends(get_current_user)],
    patient_email: Optional[str] = None
):
    # Refresh user data from database to get latest assigned_patients
    if patient_email and current_user.get("role") == "doctor":
        refreshed_user = await user_collection.find_one({"_id": current_user["_id"]})
        assigned_patients = refreshed_user.get("assigned_patients", []) if refreshed_user else []
        
        if patient_email not in assigned_patients:
            print(f"[DEBUG] Doctor {current_user['email']} not authorized for patient {patient_email}")
            print(f"[DEBUG] Assigned patients: {assigned_patients}")
            raise HTTPException(status_code=403, detail="Not authorized to view this patient's data")
        query_email = patient_email
    else:
        query_email = current_user["email"]
    assessments = []
    cursor = assessment_collection.find({"owner_email": query_email}).sort("created_at", -1)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        assessments.append(AssessmentPublic.model_validate(doc))
    return assessments

# --- Cognitive Test Endpoints ---
@app.post("/cognitive-tests/", response_model=CognitiveTestResultPublic)
async def create_cognitive_test_result(result: CognitiveTestResultCreate, current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Save Enhanced Cognitive Assessment results to MongoDB.
    Stores detailed scores across memory, attention, processing speed, and executive function.
    """
    try:
        print("📥 Received cognitive test result submission")
        print(f"   User: {current_user.get('email')}")
        print(f"   Test Type: {result.test_type}")
        print(f"   Score: {result.score}/{result.total_questions}")
        
        result_data = result.model_dump()
        result_data["owner_email"] = current_user["email"]
        result_data["created_at"] = datetime.now(timezone.utc)
        
        print(f"💾 Inserting into cognitive_test_collection...")
        new_result = await cognitive_test_collection.insert_one(result_data)
        
        print(f"✅ Test result saved with ID: {new_result.inserted_id}")
        
        created_result_doc = await cognitive_test_collection.find_one({"_id": new_result.inserted_id})
        created_result_doc["_id"] = str(created_result_doc["_id"])
        
        return CognitiveTestResultPublic.model_validate(created_result_doc)
    
    except Exception as e:
        print(f"❌ Error saving cognitive test result: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error saving cognitive test result: {str(e)}"
        )

@app.get("/cognitive-tests/", response_model=List[CognitiveTestResultPublic])
async def get_my_cognitive_tests(
    current_user: Annotated[dict, Depends(get_current_user)],
    patient_email: Optional[str] = None
):
    # Refresh user data from database to get latest assigned_patients
    if patient_email and current_user.get("role") == "doctor":
        refreshed_user = await user_collection.find_one({"_id": current_user["_id"]})
        assigned_patients = refreshed_user.get("assigned_patients", []) if refreshed_user else []
        
        if patient_email not in assigned_patients:
            print(f"[DEBUG] Doctor {current_user['email']} not authorized for patient {patient_email}")
            print(f"[DEBUG] Assigned patients: {assigned_patients}")
            raise HTTPException(status_code=403, detail="Not authorized to view this patient's data")
        query_email = patient_email
    else:
        query_email = current_user["email"]
    tests = []
    cursor = cognitive_test_collection.find({"owner_email": query_email}).sort("created_at", -1)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        tests.append(CognitiveTestResultPublic.model_validate(doc))
    return tests

# --- Doctor-Specific Endpoints ---
@app.get("/doctor/patients", response_model=List[UserPublic])
async def get_my_patients(current_user: Annotated[dict, Depends(require_doctor)]):
    patient_emails = current_user.get("assigned_patients", [])
    if not patient_emails:
        return []
    patients = []
    cursor = user_collection.find({"email": {"$in": patient_emails}})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        patients.append(UserPublic.model_validate(doc))
    return patients

@app.get("/patients/all", response_model=List[UserPublic])
async def get_all_patients(current_user: Annotated[dict, Depends(require_doctor)]):
    patients = []
    cursor = user_collection.find({"role": "patient"})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        patients.append(UserPublic.model_validate(doc))
    return patients

@app.post("/doctor/assign-patient", response_model=UserPublic)
async def assign_patient(
    request: AssignPatientRequest,
    current_user: Annotated[dict, Depends(require_doctor)]
):
    patient_email = request.patient_email
    await user_collection.update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"assigned_patients": patient_email}}
    )
    updated_doctor = await user_collection.find_one({"_id": current_user["_id"]})
    updated_doctor["_id"] = str(updated_doctor["_id"])
    return UserPublic.model_validate(updated_doctor)

@app.get("/assessments/high-risk", response_model=List[HighRiskAssessmentPublic])
async def get_high_risk_assessments(current_user: Annotated[dict, Depends(require_doctor)]):
    high_risk_assessments = []
    query = {"prediction": {"$in": ["Moderate Impairment", "Mild Impairment"]}}
    patient_docs = await user_collection.find({}, {"email": 1, "full_name": 1}).to_list(length=None)
    patient_name_map = {doc["email"]: doc.get("full_name", "N/A") for doc in patient_docs}
    cursor = assessment_collection.find(query).sort("created_at", -1)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["patient_full_name"] = patient_name_map.get(doc["owner_email"], "N/A")
        high_risk_assessments.append(HighRiskAssessmentPublic.model_validate(doc))
    return high_risk_assessments

@app.get("/doctors/all", response_model=List[UserPublic])
async def get_all_doctors(current_user: Annotated[dict, Depends(get_current_user)]):
    doctors = []
    cursor = user_collection.find({"role": "doctor"})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doctors.append(UserPublic.model_validate(doc))
    return doctors

@app.get("/users/doctors", response_model=List[UserPublic])
async def get_doctors_list(current_user: Annotated[dict, Depends(get_current_user)]):
    """Alias for /doctors/all for frontend consistency"""
    doctors = []
    cursor = user_collection.find({"role": "doctor"})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doctors.append(UserPublic.model_validate(doc))
    return doctors

@app.get("/users/patients", response_model=List[UserPublic])
async def get_patients_list(current_user: Annotated[dict, Depends(require_doctor)]):
    """Get all patients for doctors to access in chat"""
    patients = []
    cursor = user_collection.find({"role": "patient"})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        patients.append(UserPublic.model_validate(doc))
    return patients

@app.post("/patient/request-doctor", response_model=UserPublic)
async def request_doctor(
    request: AssignDoctorRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Patient sends a request to a doctor for supervision"""
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can request a doctor.")
    
    doctor_email = request.doctor_email
    doctor = await user_collection.find_one({"email": doctor_email, "role": "doctor"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    
    # Check if already requested or assigned
    existing_requests = current_user.get("doctor_requests", [])
    for req in existing_requests:
        if req.get("doctor_email") == doctor_email and req.get("status") == "pending":
            raise HTTPException(status_code=400, detail="Request already pending with this doctor.")
    
    if current_user.get("assigned_doctor") == doctor_email:
        raise HTTPException(status_code=400, detail="This doctor is already assigned to you.")
    
    # Create request object
    request_obj = {
        "doctor_id": str(doctor["_id"]),
        "doctor_email": doctor_email,
        "doctor_name": doctor.get("full_name", "Unknown"),
        "status": "pending",
        "requested_at": datetime.now(timezone.utc)
    }
    
    # Add to patient's doctor_requests
    await user_collection.update_one(
        {"_id": current_user["_id"]},
        {"$push": {"doctor_requests": request_obj}}
    )
    
    # Add to doctor's pending_patients
    patient_request_obj = {
        "patient_id": str(current_user["_id"]),
        "patient_email": current_user["email"],
        "patient_name": current_user.get("full_name", "Unknown"),
        "status": "pending",
        "requested_at": datetime.now(timezone.utc)
    }
    
    await user_collection.update_one(
        {"_id": doctor["_id"]},
        {"$push": {"pending_patients": patient_request_obj}}
    )
    
    # Return updated patient
    updated_patient = await user_collection.find_one({"_id": current_user["_id"]})
    updated_patient["_id"] = str(updated_patient["_id"])
    return UserPublic.model_validate(updated_patient)

@app.post("/doctor/respond-request", response_model=UserPublic)
async def respond_to_patient_request(
    request: RespondToRequestRequest,
    current_user: Annotated[dict, Depends(require_doctor)]
):
    """Doctor approves or rejects a patient's request"""
    if request.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'.")
    
    patient_email = request.patient_email
    patient = await user_collection.find_one({"email": patient_email, "role": "patient"})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    
    # Find the pending request in doctor's pending_patients
    pending_patients = current_user.get("pending_patients", [])
    request_found = False
    for req in pending_patients:
        if req.get("patient_email") == patient_email and req.get("status") == "pending":
            request_found = True
            break
    
    if not request_found:
        raise HTTPException(status_code=404, detail="No pending request from this patient.")
    
    new_status = "approved" if request.action == "approve" else "rejected"
    
    # Update doctor's pending_patients status
    await user_collection.update_one(
        {"_id": current_user["_id"], "pending_patients.patient_email": patient_email},
        {"$set": {"pending_patients.$.status": new_status}}
    )
    
    # Update patient's doctor_requests status
    await user_collection.update_one(
        {"_id": patient["_id"], "doctor_requests.doctor_email": current_user["email"]},
        {"$set": {"doctor_requests.$.status": new_status}}
    )
    
    # If approved, set assigned relationships
    if request.action == "approve":
        # Add patient to doctor's assigned_patients
        await user_collection.update_one(
            {"_id": current_user["_id"]},
            {"$addToSet": {"assigned_patients": patient_email}}
        )
        
        # Set doctor as patient's assigned_doctor
        await user_collection.update_one(
            {"_id": patient["_id"]},
            {"$set": {"assigned_doctor": current_user["email"]}}
        )
        
        # Create notification for the patient
        notification_doc = {
            "user_email": patient["email"],
            "message": f"Dr. {current_user.get('full_name', 'Unknown')} has accepted your supervision request.",
            "type": "doctor_acceptance",
            "status": "unread",
            "timestamp": datetime.now(timezone.utc)
        }
        await notification_collection.insert_one(notification_doc)
        print(f"[Notification] Created notification for patient {patient['email']}")
    
    # Return updated doctor
    updated_doctor = await user_collection.find_one({"_id": current_user["_id"]})
    updated_doctor["_id"] = str(updated_doctor["_id"])
    return UserPublic.model_validate(updated_doctor)

@app.get("/patient/my-requests", response_model=List[DoctorRequestPublic])
async def get_my_doctor_requests(current_user: Annotated[dict, Depends(get_current_user)]):
    """Get patient's doctor requests"""
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can view their requests.")
    
    requests = current_user.get("doctor_requests", [])
    return [DoctorRequestPublic(**req) for req in requests]

@app.get("/doctor/pending-requests", response_model=List[PatientRequestPublic])
async def get_pending_patient_requests(current_user: Annotated[dict, Depends(require_doctor)]):
    """Get doctor's pending patient requests"""
    requests = current_user.get("pending_patients", [])
    # Filter only pending
    pending = [req for req in requests if req.get("status") == "pending"]
    return [PatientRequestPublic(**req) for req in pending]

# --- Doctor Dashboard Summary Endpoint ---
@app.get("/doctor/dashboard-summary", response_model=DoctorDashboardData)
async def get_doctor_dashboard_summary(current_user: Annotated[dict, Depends(require_doctor)]):
    patient_emails = current_user.get("assigned_patients", [])
    
    # 1. Get total patients
    total_patients = len(patient_emails)

    # 2. Get high-risk cases count
    high_risk_query = {
        "owner_email": {"$in": patient_emails},
        "prediction": {"$in": ["Moderate Impairment", "Mild Impairment"]}
    }
    high_risk_count = await assessment_collection.count_documents(high_risk_query)

    # 3. Get summary for each patient
    my_patients_summary = []
    if patient_emails:
        patients_cursor = user_collection.find({"email": {"$in": patient_emails}})
        async for patient_doc in patients_cursor:
            patient_doc["_id"] = str(patient_doc["_id"])

            # Find last MRI result
            last_mri = await assessment_collection.find_one(
                {"owner_email": patient_doc["email"]}, sort=[("created_at", -1)]
            )
            if last_mri:
                last_mri["_id"] = str(last_mri["_id"])

            # Find last cognitive test
            last_cognitive = await cognitive_test_collection.find_one(
                {"owner_email": patient_doc["email"]}, sort=[("created_at", -1)]
            )
            if last_cognitive:
                last_cognitive["_id"] = str(last_cognitive["_id"])
            
            patient_summary = PatientSummary(
                **patient_doc,
                last_mri_result=last_mri,
                last_cognitive_score=last_cognitive
            )
            my_patients_summary.append(patient_summary)

    # 4. Get high-risk patients details
    high_risk_patients = []
    if patient_emails:
        patient_docs = await user_collection.find({"email": {"$in": patient_emails}}, {"email": 1, "full_name": 1}).to_list(length=None)
        patient_name_map = {doc["email"]: doc.get("full_name", "N/A") for doc in patient_docs}

        high_risk_cursor = assessment_collection.find(high_risk_query).sort("created_at", -1).limit(5)
        async for doc in high_risk_cursor:
            doc["_id"] = str(doc["_id"])
            doc["patient_full_name"] = patient_name_map.get(doc["owner_email"], "N/A")
            high_risk_patients.append(HighRiskAssessmentPublic.model_validate(doc))

    return DoctorDashboardData(
        total_patients=total_patients,
        high_risk_cases_count=high_risk_count,
        my_patients_summary=my_patients_summary,
        high_risk_patients=high_risk_patients
    )


# -------------------
# AUDIO-BASED COGNITIVE TEST ENDPOINTS
# -------------------

@app.post("/compare-text", response_model=TextComparisonResponse)
async def compare_text(request: TextComparisonRequest):
    """
    Compare two text strings and return similarity score using SequenceMatcher.
    Used for audio recall test to compare original sentence with spoken transcript.
    """
    try:
        # Validate inputs
        if not request.original or not request.spoken:
            print(f"❌ Missing text for comparison: original={bool(request.original)}, spoken={bool(request.spoken)}")
            raise HTTPException(
                status_code=400,
                detail="Missing text for comparison. Both 'original' and 'spoken' fields are required."
            )
        
        original = request.original.lower().strip()
        spoken = request.spoken.lower().strip()
        
        print(f"🔄 Comparing texts: original='{original[:50]}...', spoken='{spoken[:50]}...'")
        
        # Use SequenceMatcher to calculate similarity ratio
        similarity = SequenceMatcher(None, original, spoken).ratio()
        
        # Convert to percentage (0-100)
        similarity_percentage = similarity * 100
        
        print(f"✅ Similarity score: {similarity_percentage:.2f}%")
        
        return TextComparisonResponse(similarityScore=similarity_percentage)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error comparing text: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error comparing text: {str(e)}"
        )


@app.post("/cognitive-tests/audio-recall", response_model=AudioRecallTestPublic)
async def create_audio_recall_test(
    test_data: AudioRecallTestCreate,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Save audio-based cognitive recall test results to MongoDB.
    Stores detailed round-by-round performance including original text,
    spoken text, and similarity scores.
    """
    try:
        print("📥 Received audio recall test submission")
        print(f"   User: {current_user.get('email')}")
        print(f"   Test Type: {test_data.test_type}")
        print(f"   Score: {test_data.score}/{test_data.total_questions}")
        print(f"   Average Similarity: {test_data.average_similarity}%")
        print(f"   Correct Recalls: {test_data.correct_recalls}/{test_data.total_rounds}")
        
        # Prepare data for MongoDB insertion
        test_dict = test_data.model_dump()
        test_dict["owner_email"] = current_user["email"]
        test_dict["created_at"] = datetime.now(timezone.utc)
        
        # Convert round_details to dictionaries if needed
        test_dict["round_details"] = [
            detail.model_dump() if hasattr(detail, 'model_dump') else detail
            for detail in test_data.round_details
        ]
        
        print(f"💾 Inserting into audio_recall_collection...")
        print(f"   Round details count: {len(test_dict['round_details'])}")
        
        # Insert into audio_recall_collection
        new_test = await audio_recall_collection.insert_one(test_dict)
        
        print(f"✅ Audio recall test saved with ID: {new_test.inserted_id}")
        
        # Retrieve the created document
        created_test_doc = await audio_recall_collection.find_one({"_id": new_test.inserted_id})
        created_test_doc["_id"] = str(created_test_doc["_id"])
        
        return AudioRecallTestPublic.model_validate(created_test_doc)
    
    except Exception as e:
        print(f"❌ Error saving audio recall test: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error saving audio recall test: {str(e)}"
        )


@app.get("/cognitive-tests/audio-recall", response_model=List[AudioRecallTestPublic])
async def get_audio_recall_tests(
    current_user: Annotated[dict, Depends(get_current_user)],
    patient_email: Optional[str] = None
):
    """
    Retrieve audio recall test results for the current user or a specific patient (for doctors).
    Returns all audio-based cognitive tests sorted by date (most recent first).
    """
    try:
        # Determine which email to query
        if patient_email and current_user.get("role") == "doctor":
            # Doctor viewing patient's results
            if patient_email not in current_user.get("assigned_patients", []):
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to view this patient's data"
                )
            query_email = patient_email
        else:
            # User viewing their own results
            query_email = current_user["email"]
        
        # Fetch tests from database
        tests = []
        cursor = audio_recall_collection.find({"owner_email": query_email}).sort("created_at", -1)
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            tests.append(AudioRecallTestPublic.model_validate(doc))
        
        return tests
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving audio recall tests: {str(e)}"
        )

# -------------------
# Notification Endpoints
# -------------------

@app.get("/notifications/", response_model=List[NotificationPublic])
async def get_notifications(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Get all notifications for the current user, sorted by timestamp (newest first)
    """
    try:
        notifications = []
        cursor = notification_collection.find(
            {"user_email": current_user["email"]}
        ).sort("timestamp", -1)
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            notifications.append(NotificationPublic.model_validate(doc))
        
        return notifications
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving notifications: {str(e)}"
        )

@app.patch("/notifications/mark-read")
async def mark_notifications_as_read(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Mark all unread notifications for the current user as read
    """
    try:
        result = await notification_collection.update_many(
            {"user_email": current_user["email"], "status": "unread"},
            {"$set": {"status": "read"}}
        )
        
        return {
            "message": "Notifications marked as read",
            "modified_count": result.modified_count
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marking notifications as read: {str(e)}"
        )

# -------------------
# Real-time Chat with WebSocket
# -------------------

class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # Dictionary to store active connections: {email: WebSocket}
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, email: str, websocket: WebSocket):
        """Accept and store a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[email] = websocket
        print(f"[WebSocket] User {email} connected. Active connections: {len(self.active_connections)}")
    
    def disconnect(self, email: str):
        """Remove a WebSocket connection"""
        if email in self.active_connections:
            del self.active_connections[email]
            print(f"[WebSocket] User {email} disconnected. Active connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, email: str):
        """Send a message to a specific user if they're connected"""
        if email in self.active_connections:
            try:
                await self.active_connections[email].send_json(message)
                print(f"[WebSocket] Message sent to {email}")
                return True
            except Exception as e:
                print(f"[WebSocket] Error sending to {email}: {e}")
                self.disconnect(email)
                return False
        return False

# Create a global connection manager instance
manager = ConnectionManager()

@app.websocket("/ws/{email}")
async def websocket_endpoint(websocket: WebSocket, email: str):
    """
    WebSocket endpoint for real-time chat.
    Each user connects with their email.
    """
    await manager.connect(email, websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            receiver_email = data.get("receiver_email")
            message_text = data.get("message")
            
            if not receiver_email or not message_text:
                await websocket.send_json({
                    "error": "Missing receiver_email or message"
                })
                continue
            
            # Save message to database
            message_doc = {
                "sender_email": email,
                "receiver_email": receiver_email,
                "message": message_text,
                "timestamp": datetime.now(timezone.utc),
                "read": False
            }
            
            result = await messages_collection.insert_one(message_doc)
            message_doc["_id"] = str(result.inserted_id)
            
            print(f"[WebSocket] Message from {email} to {receiver_email}: {message_text[:50]}...")
            
            # Send to receiver if they're online
            message_to_send = {
                "_id": str(result.inserted_id),
                "sender_email": email,
                "receiver_email": receiver_email,
                "message": message_text,
                "timestamp": message_doc["timestamp"].isoformat(),
                "read": False
            }
            
            sent = await manager.send_personal_message(message_to_send, receiver_email)
            
            # Echo back to sender with delivery status
            await websocket.send_json({
                **message_to_send,
                "delivered": sent
            })
    
    except WebSocketDisconnect:
        manager.disconnect(email)
        print(f"[WebSocket] Client {email} disconnected normally")
    except Exception as e:
        manager.disconnect(email)
        print(f"[WebSocket] Error for {email}: {e}")

@app.get("/messages/{email1}/{email2}", response_model=List[MessagePublic])
async def get_chat_history(
    email1: str,
    email2: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Get chat history between two users.
    Only accessible if current_user is one of the participants.
    """
    # Verify current user is part of this conversation
    if current_user["email"] not in [email1, email2]:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own conversations"
        )
    
    try:
        # Find all messages between these two users (in both directions)
        messages = []
        cursor = messages_collection.find({
            "$or": [
                {"sender_email": email1, "receiver_email": email2},
                {"sender_email": email2, "receiver_email": email1}
            ]
        }).sort("timestamp", 1)  # Oldest first
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            messages.append(MessagePublic.model_validate(doc))
        
        print(f"[Chat] Retrieved {len(messages)} messages between {email1} and {email2}")
        return messages
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving messages: {str(e)}"
        )

@app.patch("/messages/mark-read/{partner_email}")
async def mark_messages_as_read(
    partner_email: str,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Mark all messages from partner_email to current_user as read.
    """
    try:
        result = await messages_collection.update_many(
            {
                "sender_email": partner_email,
                "receiver_email": current_user["email"],
                "read": False
            },
            {"$set": {"read": True}}
        )
        
        return {
            "message": "Messages marked as read",
            "modified_count": result.modified_count
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marking messages as read: {str(e)}"
        )