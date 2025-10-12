import io
import os
from PIL import Image
from typing import Annotated, Optional, List
from datetime import datetime, timezone
import shutil
import certifi
import numpy as np
import cv2 # <-- ADDED THIS IMPORT

import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status
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

class CognitiveTestResultPublic(BaseModel):
    id: str = Field(alias="_id")
    test_type: str
    score: int
    total_questions: int
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

# --- Schemas for the Doctor Dashboard ---
class PatientSummary(UserPublic):
    last_mri_result: Optional[AssessmentPublic] = None
    last_cognitive_score: Optional[CognitiveTestResultPublic] = None

class DoctorDashboardData(BaseModel):
    total_patients: int
    high_risk_cases_count: int
    my_patients_summary: List[PatientSummary]
    high_risk_patients: List[HighRiskAssessmentPublic]

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
        user_data["professional_details"] = DoctorProfessionalDetails().model_dump()
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

    return {
        "prediction": pred_class,
        "confidence": confidence,
        "class_probabilities": {class_names[i]: f"{float(probs[i]):.2%}" for i in range(len(probs))}
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
    if patient_email and current_user.get("role") == "doctor":
        if patient_email not in current_user.get("assigned_patients", []):
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
    result_data = result.model_dump()
    result_data["owner_email"] = current_user["email"]
    result_data["created_at"] = datetime.now(timezone.utc)
    new_result = await cognitive_test_collection.insert_one(result_data)
    created_result_doc = await cognitive_test_collection.find_one({"_id": new_result.inserted_id})
    created_result_doc["_id"] = str(created_result_doc["_id"])
    return CognitiveTestResultPublic.model_validate(created_result_doc)

@app.get("/cognitive-tests/", response_model=List[CognitiveTestResultPublic])
async def get_my_cognitive_tests(
    current_user: Annotated[dict, Depends(get_current_user)],
    patient_email: Optional[str] = None
):
    if patient_email and current_user.get("role") == "doctor":
        if patient_email not in current_user.get("assigned_patients", []):
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

@app.post("/patient/assign-doctor", response_model=UserPublic)
async def assign_doctor_to_patient(
    request: AssignDoctorRequest,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Only patients can assign a doctor.")
    doctor_email = request.doctor_email
    doctor = await user_collection.find_one({"email": doctor_email, "role": "doctor"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    await user_collection.update_one(
        {"_id": doctor["_id"]},
        {"$addToSet": {"assigned_patients": current_user["email"]}}
    )
    current_user["_id"] = str(current_user["_id"])
    return UserPublic.model_validate(current_user)

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