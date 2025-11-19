# 🧪 Testing Guide: Grad-CAM MRI Visualization

## ⚡ Quick Start (5 Minutes)

### **Prerequisites**
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed
- ✅ MongoDB Atlas connection active
- ✅ Model file (`best_model.pth`) present in Modelapi folder

---

## 🚀 Step-by-Step Testing

### **1. Start Backend Server**

```bash
# Navigate to backend directory
cd C:\Alzer\Modelapi

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
[INFO] Model loaded and ready.
[INFO] Connected to MongoDB Atlas.
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Verify Backend:**
- Open browser: `http://127.0.0.1:8000/docs`
- You should see FastAPI Swagger documentation
- Look for `/predict` endpoint

---

### **2. Start Frontend Server**

```bash
# Open NEW terminal/PowerShell window
cd C:\Alzer\frontend

# Start Next.js development server
npm run dev
```

**Expected Output:**
```
> frontend@0.1.0 dev
> next dev

   ▲ Next.js 15.5.4
   - Local:        http://localhost:3000
   - Ready in 2.5s
```

**Verify Frontend:**
- Open browser: `http://localhost:3000`
- You should see AlzAware login page

---

### **3. Login as Patient**

1. **Navigate to:** `http://localhost:3000/login`

2. **Use test credentials** (or register new account):
   - Email: `patient@test.com`
   - Password: `password123`

3. **Click "Login"**

4. **Verify:** You should be redirected to patient dashboard

---

### **4. Upload MRI Scan**

1. **From Dashboard:**
   - Click "Start New Assessment" → "Analyze MRI Scan"
   - OR directly navigate to: `http://localhost:3000/assessment/mri-upload`

2. **Upload Image:**
   - Click the upload area OR drag-and-drop
   - Select a grayscale brain MRI image
   - You should see image preview

3. **Submit for Analysis:**
   - Click "Submit for Analysis" button
   - Wait for processing (5-10 seconds)

---

### **5. Verify Results Display**

#### **✅ Expected: Prediction Card (Blue)**
```
┌─────────────────────────────────┐
│  Prediction Result              │
│  🧠 Mild Impairment            │
│  Confidence: 87.65%            │
└─────────────────────────────────┘
```

#### **✅ Expected: Grad-CAM Card (Purple)**
```
┌─────────────────────────────────────────────────────┐
│         Grad-CAM Visualization                      │
│  Highlighted regions show areas that contributed    │
│  most to the model's decision                       │
│                                                     │
│  ┌───────────────┐    ┌────────────────┐          │
│  │ Original MRI  │    │ Heatmap Overlay│          │
│  │   [image]     │    │  [colored img] │          │
│  └───────────────┘    └────────────────┘          │
│                                                     │
│  Red/Yellow areas indicate regions of high         │
│  importance for the prediction                     │
└─────────────────────────────────────────────────────┘
```

---

### **6. Verify Heatmap Details**

**Original MRI (Left Side):**
- ✅ Shows the uploaded grayscale brain scan
- ✅ Clear, properly sized
- ✅ Gray border around image

**Heatmap Overlay (Right Side):**
- ✅ Shows same MRI with colored overlay
- ✅ Colors range from blue → cyan → green → yellow → red
- ✅ Red/yellow regions highlight important areas
- ✅ Purple border around image

**Color Interpretation:**
- 🔵 Blue areas = Low importance
- 🟢 Green areas = Moderate importance  
- 🟡 Yellow areas = High importance
- 🔴 Red areas = Critical regions for prediction

---

### **7. Backend Verification**

**Check Terminal Output:**
```
[INFO] Generating Grad-CAM heatmap...
[INFO] Heatmap saved to: uploads/heatmaps/heatmap_<uuid>.png
```

**Check File System:**
```bash
# Navigate to heatmaps directory
cd C:\Alzer\Modelapi\uploads\heatmaps

# List files (PowerShell)
Get-ChildItem

# You should see: heatmap_<uuid>.png files
```

**Verify Image URL:**
- Right-click heatmap in browser
- Click "Open image in new tab"
- URL should be: `http://127.0.0.1:8000/uploads/heatmaps/heatmap_<uuid>.png`
- Image should display correctly

---

### **8. Database Verification**

The assessment should be saved to MongoDB:

1. **Check MongoDB Atlas:**
   - Login to MongoDB Atlas
   - Navigate to your cluster → Collections
   - Open `alzAwareDB` → `assessments`
   - You should see new entry with:
     - `prediction`: "Mild Impairment" (or other class)
     - `confidence`: 0.8765 (example)
     - `owner_email`: your email
     - `created_at`: timestamp

2. **Note:** Heatmap URL is NOT saved to database (only file on server)

---

## 🧪 Test Cases

### **Test Case 1: Valid MRI Upload**
**Input:** Grayscale brain MRI image (256x256 or larger)
**Expected:**
- ✅ Prediction displayed
- ✅ Confidence score shown
- ✅ Heatmap generated and displayed
- ✅ Assessment saved to database
- ✅ Success confirmation message

### **Test Case 2: Invalid Image Shape**
**Input:** Non-brain image (landscape photo, diagram)
**Expected:**
- ❌ Error: "Invalid image shape. Please upload a proper brain MRI scan."
- ❌ No prediction displayed
- ❌ No heatmap generated

### **Test Case 3: Non-Grayscale Image**
**Input:** Color RGB image of brain
**Expected:**
- ❌ Error: "Incorrect image type. Please upload a grayscale MRI scan."
- ❌ No prediction displayed
- ❌ No heatmap generated

### **Test Case 4: Very Small Image**
**Input:** Tiny image (50x50 pixels)
**Expected:**
- May pass validation if aspect ratio correct
- Prediction generated (but may be less accurate)
- Heatmap generated (but lower quality)

### **Test Case 5: Multiple Uploads**
**Input:** Upload 3 different MRI scans sequentially
**Expected:**
- ✅ Each upload generates unique heatmap
- ✅ Previous predictions cleared on new upload
- ✅ Each heatmap saved with unique UUID filename
- ✅ All 3 assessments saved to database

---

## 🔍 API Testing (Advanced)

### **Using cURL**
```bash
curl -X POST "http://127.0.0.1:8000/predict" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/brain_mri.jpg"
```

### **Expected Response**
```json
{
  "prediction": "Mild Impairment",
  "confidence": 0.8765,
  "class_probabilities": {
    "No Impairment": "2.34%",
    "Very Mild Impairment": "10.45%",
    "Mild Impairment": "87.65%",
    "Moderate Impairment": "0.56%"
  },
  "heatmap_url": "http://127.0.0.1:8000/uploads/heatmaps/heatmap_a7f3e9d2.png"
}
```

### **Using Postman**
1. Create new POST request
2. URL: `http://127.0.0.1:8000/predict`
3. Body → form-data
4. Key: `file` (type: File)
5. Value: Select MRI image file
6. Send request
7. Verify response contains `heatmap_url`

---

## 🐛 Common Issues & Solutions

### **Issue 1: Backend won't start**
**Error:** `ModuleNotFoundError: No module named 'cv2'`
**Solution:**
```bash
cd C:\Alzer\Modelapi
pip install -r requirements.txt
```

### **Issue 2: Heatmap not displaying**
**Symptoms:** Prediction shows but no heatmap section
**Debugging:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed image requests
4. Verify `heatmap_url` in API response is not null

**Solutions:**
- Ensure backend is running on port 8000
- Check CORS settings allow localhost:3000
- Verify uploads/heatmaps directory exists
- Check backend logs for Python exceptions

### **Issue 3: Model file missing**
**Error:** `FileNotFoundError: Model checkpoint not found`
**Solution:**
- Ensure `best_model.pth` exists in `C:\Alzer\Modelapi\`
- File size should be ~90-100MB
- If missing, restore from backup or retrain model

### **Issue 4: Heatmap colors wrong**
**Symptoms:** Heatmap shows but colors are inverted or incorrect
**Solution:**
- Check `cv2.COLORMAP_JET` is being used
- Verify BGR→RGB conversion in `create_heatmap_overlay()`
- Try different colormap: `cv2.COLORMAP_HOT` or `cv2.COLORMAP_VIRIDIS`

### **Issue 5: Gradients error**
**Error:** `RuntimeError: element 0 of tensors does not require grad`
**Solution:**
- Ensure `img_tensor_grad.requires_grad = True`
- Check PyTorch version (should be 2.0+)
- Verify model is in eval mode but gradients enabled

---

## 📊 Performance Benchmarks

**Typical Processing Times:**
- Image validation: ~50ms
- Model inference: ~200-500ms (CPU) or ~50-100ms (GPU)
- Grad-CAM generation: ~300-600ms
- Heatmap overlay creation: ~50ms
- Total: ~1-2 seconds per upload

**Storage Requirements:**
- Each heatmap overlay: ~50-200KB
- 100 uploads = ~5-20MB storage
- Consider cleanup policy for old heatmaps

---

## ✅ Success Criteria

Your implementation is working correctly if:

- [ ] Backend starts without errors
- [ ] Frontend displays MRI upload page
- [ ] Image upload shows preview
- [ ] Submit button triggers analysis
- [ ] Prediction card displays with confidence
- [ ] Grad-CAM card displays with two images
- [ ] Left image shows original grayscale MRI
- [ ] Right image shows colored heatmap overlay
- [ ] Red/yellow regions visible on heatmap
- [ ] Explanatory text visible below images
- [ ] Assessment saved confirmation appears
- [ ] Backend logs show heatmap generation
- [ ] Heatmap file exists in uploads/heatmaps/
- [ ] Database contains new assessment record

---

## 🎓 Understanding the Heatmap

### **What Am I Looking At?**
The Grad-CAM heatmap shows which parts of the MRI the AI model "looked at" when making its diagnosis prediction.

### **Clinical Relevance**
For Alzheimer's detection, expect red/yellow regions in:
- **Hippocampus:** Memory formation center
- **Temporal lobes:** Memory and language processing
- **Entorhinal cortex:** Early Alzheimer's indicator
- **Ventricles:** Enlargement may indicate brain atrophy

### **Validation**
If the heatmap shows red regions in unrelated areas (edges, skull, background):
- Model may need retraining
- Image preprocessing may be incorrect
- Consider data augmentation during training

---

## 📸 Screenshot Checklist

Take screenshots of:
1. [ ] MRI upload page with image preview
2. [ ] Prediction result card
3. [ ] Side-by-side heatmap comparison
4. [ ] Backend terminal showing heatmap generation logs
5. [ ] File explorer showing saved heatmap files
6. [ ] MongoDB collection with new assessment

---

## 🔄 Next Steps

After successful testing:

1. **Production Considerations:**
   - Implement heatmap cleanup (delete old files)
   - Add rate limiting for predict endpoint
   - Optimize heatmap generation for GPU
   - Cache frequently accessed heatmaps

2. **Feature Enhancements:**
   - Download heatmap button
   - Comparison of multiple MRI heatmaps
   - Region-specific analysis scores
   - 3D heatmap visualization

3. **Documentation:**
   - Create user guide for interpreting heatmaps
   - Doctor training materials
   - Clinical validation studies
   - Regulatory documentation (FDA, CE marking)

---

## 📞 Support

If you encounter issues during testing:

1. **Check logs:**
   - Backend: Terminal running uvicorn
   - Frontend: Browser DevTools Console
   - Network: Browser DevTools Network tab

2. **Verify setup:**
   - Python version: 3.8+
   - Node version: 18+
   - Dependencies installed correctly

3. **Test isolation:**
   - Test backend API directly with cURL/Postman
   - Test frontend with mock data
   - Check database connectivity separately

---

**Testing Date:** November 11, 2025
**Version:** 1.0
**Status:** Ready for Testing

---

**Happy Testing! 🚀**
