# 🚀 Quick Test Guide - AlzAware Comprehensive Fix

## 🎯 Quick Start (5 Minutes)

### Step 1: Restart Services

```bash
# Terminal 1 - Backend
cd C:\Alzer\Modelapi
python main.py

# Terminal 2 - Frontend  
cd C:\Alzer\frontend
npm run dev
```

Wait for:
- Backend: `Uvicorn running on http://127.0.0.1:8000`
- Frontend: `ready - started server on 0.0.0.0:3000`

---

## 🧪 Test 1: Fix 403 Error (2 minutes)

**Goal**: Verify doctors can view patient data without 403 errors.

### Steps:

1. **Open**: http://localhost:3000/login

2. **Login as Doctor**:
   - Email: `doctor@example.com` (use your test doctor account)
   - Password: (your password)

3. **Navigate to High-Risk Review**:
   - Click "High-Risk Review" in sidebar or dashboard
   - You should see a list of patients with high-risk assessments

4. **Click Patient Email**:
   - Click on any patient email link
   - **Expected**: Patient data loads successfully
   - **Expected**: See assessments table
   - **Expected**: See cognitive tests table
   - **Previously**: Would show 403 Forbidden error

5. **Check Console** (F12):
   ```
   [PatientDetail] Fetching data for patient: patient@example.com
   [PatientDetail] Token verified, user: doctor@example.com
   [PatientDetail] Data fetched successfully
   ```

✅ **Pass**: If you see patient data without 403 error
❌ **Fail**: If you still see 403 error → Check backend logs

---

## 💬 Test 2: Doctor Chat View (3 minutes)

**Goal**: Verify doctors can chat with patients using new sidebar.

### Steps:

1. **Login as Doctor** (if not already)

2. **Click "💬 Chat" in Header**:
   - Located in top navigation bar
   - Green text with message icon

3. **Verify Left Sidebar**:
   - **Expected**: See "My Patients" header
   - **Expected**: List of assigned patients
   - **Expected**: Each patient shows name and email

4. **Click a Patient**:
   - Click on any patient in the list
   - **Expected**: Patient card highlights in teal
   - **Expected**: Right side shows chat conversation
   - **Expected**: Patient name in header

5. **Send a Test Message**:
   - Type: "Hello, how are you feeling today?"
   - Click "Send"
   - **Expected**: Message appears in blue/teal bubble on right
   - **Expected**: Timestamp shows below message

6. **Check Console** (F12):
   ```
   [Chat] Fetching assigned patients for doctor: ...
   [Chat] Assigned patients: [...]
   [WebSocket] Connected successfully
   [WebSocket] Sent message: ...
   ```

✅ **Pass**: If sidebar shows patients and chat works
❌ **Fail**: If sidebar is empty → Check if patients are assigned

---

## 👤 Test 3: Patient Chat View (2 minutes)

**Goal**: Verify patients can see chat and message doctors.

### Steps:

1. **Logout** and **Login as Patient**:
   - Email: `patient@example.com` (use test patient account)
   - Password: (your password)

2. **Click "💬 Chat" in Header**

3. **Verify Left Sidebar**:
   - **Expected**: See "Your Doctors" header
   - **Expected**: List of assigned doctors
   - **Expected**: Each doctor shows "Dr. Name" and specialization

4. **Click a Doctor**:
   - Click on your assigned doctor
   - **Expected**: Doctor card highlights in green
   - **Expected**: See previous messages (if any)

5. **Send Reply**:
   - Type: "I'm doing well, thank you!"
   - Click "Send"
   - **Expected**: Message appears instantly

6. **Verify on Patient Profile**:
   - Navigate to: http://localhost:3000/patient/profile
   - **Expected**: See "💬 Message Your Doctor" green banner
   - Click "Open Chat"
   - **Expected**: Opens same chat page

✅ **Pass**: If patient can see doctors and send messages
❌ **Fail**: If no doctors appear → Verify doctor assigned the patient

---

## 🔔 Test 4: Notification System (Optional)

**Goal**: Verify notifications work when doctor accepts patient.

### Steps:

1. **Login as Patient** (new account recommended)

2. **Request a Doctor**:
   - Go to "View Doctors"
   - Click "Request Supervision" on any doctor

3. **Login as That Doctor**

4. **Approve Request**:
   - Go to "Pending Requests" or Doctor Dashboard
   - Click "Approve" on the patient request

5. **Login Back as Patient**

6. **Check Notifications**:
   - Look for notification badge or section
   - **Expected**: See "Dr. [Name] has accepted your supervision request."

✅ **Pass**: Notification appears after approval
❌ **Fail**: No notification → Check backend logs for notification creation

---

## 🔐 Test 5: Token Validation (Optional)

**Goal**: Verify expired tokens redirect to login.

### Method 1: Manual Token Expiration

1. **Login as Doctor**
2. **Open DevTools** (F12) → Application → Local Storage
3. **Delete "token"** value
4. **Navigate to Patient Detail Page**
5. **Expected**: Redirects to login with "Session expired" message

### Method 2: Wait for Natural Expiration

1. **Login as Doctor**
2. **Wait 24 hours** (or whatever your JWT expiry is)
3. **Try to access Patient Detail Page**
4. **Expected**: Redirects to login

✅ **Pass**: Redirects to login with proper message
❌ **Fail**: Shows error instead → Check token validation logic

---

## 🐛 Troubleshooting

### Issue: 403 Error Still Appears

**Solution**:
1. Check if patient is actually assigned:
   ```javascript
   // In MongoDB or backend console
   Doctor's assigned_patients array should contain patient email
   ```

2. Restart backend to load new code:
   ```bash
   # Stop backend (Ctrl+C)
   cd C:\Alzer\Modelapi
   python main.py
   ```

3. Check backend console for debug logs:
   ```
   [DEBUG] Doctor {email} not authorized for patient {email}
   [DEBUG] Assigned patients: [...]
   ```

### Issue: Chat Sidebar Empty

**Solution**:
1. Verify assignment in database
2. Check browser console:
   ```javascript
   [Chat] Assigned doctors/patients: []
   ```
3. If empty, assign patient through UI:
   - Doctor: Go to High-Risk Review → Click patient → Assign

### Issue: Messages Not Sending

**Solution**:
1. Check WebSocket connection:
   - DevTools → Network → WS tab
   - Should see green connection to `ws://127.0.0.1:8000/ws/{email}`

2. Check backend WebSocket logs:
   ```
   [WebSocket] User {email} connected
   [WebSocket] Message from {sender} to {receiver}
   ```

3. Reload page and try again

### Issue: Backend Not Starting

**Solution**:
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r requirements.txt

# Check MongoDB connection
# Verify MONGO_DETAILS string in main.py is correct
```

---

## ✅ Success Checklist

After testing, you should have:

- [x] Doctor can view patient data without 403
- [x] Doctor sees patient list in chat sidebar
- [x] Patient sees doctor list in chat sidebar  
- [x] Both can send/receive messages in real-time
- [x] Chat button visible in header for both roles
- [x] Patient profile shows "Message Your Doctor" banner
- [x] Messages persist after page reload
- [x] Expired token redirects to login

---

## 🎉 All Tests Passed?

**Congratulations!** 🎊 All fixes are working correctly.

Your AlzAware application now has:
- ✅ Fixed 403 authorization errors
- ✅ Enhanced token validation
- ✅ Functional real-time chat for both roles
- ✅ Notification system ready
- ✅ Multiple chat access points

---

**Last Updated**: 2025-11-12
**Version**: 1.0.0
