# Quick Test Guide: Doctor Request-Approval Feature

## Setup

1. **Start Backend:**
   ```bash
   cd C:\Alzer\Modelapi
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd C:\Alzer\frontend
   npm run dev
   ```

3. **Open Browser:**
   ```
   http://localhost:3000
   ```

---

## Test Scenario 1: Patient Sends Request

### Step 1: Register/Login as Patient
- Email: `testpatient@gmail.com`
- Password: `test@123`
- Role: `patient`

### Step 2: Navigate to Dashboard
- After login, you should see the Patient Dashboard
- Look for "Doctor Assignment" section (usually in sidebar or as a card)

### Step 3: Send Request
1. Click dropdown to view all doctors
2. Select a doctor (e.g., `testdoctor@gmail.com`)
3. Click **"Send Request"** button
4. **Expected:** Green success message appears:
   > "Request sent successfully! Awaiting doctor approval."

### Step 4: Verify Pending Status
- Yellow box should appear showing:
  > ⏳ Request Pending  
  > Awaiting approval from Dr. [Doctor Name]
- Send Request button should be hidden
- Request should appear in "Request History" below

---

## Test Scenario 2: Doctor Reviews and Approves Request

### Step 1: Register/Login as Doctor
- Email: `testdoctor@gmail.com`
- Password: `test@123`
- Role: `doctor`

### Step 2: Navigate to Requests Tab
1. After login, you'll see Doctor Dashboard
2. Click **"Requests"** tab (second tab)
3. **Expected:** You should see the pending request from `testpatient@gmail.com`

### Step 3: View Request Details
The request card should show:
- Patient icon (blue circle with User icon)
- Patient name: `Test Patient`
- Patient email: `testpatient@gmail.com`
- Timestamp: `Requested: November 9, 2025 at 12:00 PM`

### Step 4: Approve Request
1. Click green **"Accept"** button
2. **Expected:**
   - Request disappears from list
   - "No pending requests" message appears (if no other requests)

### Step 5: Verify Patient Added
1. Click **"Overview"** tab
2. Check "Total Patients" card → count should increase by 1
3. Scroll down to "My Patients" section
4. **Expected:** Test Patient should appear in the list

---

## Test Scenario 3: Patient Sees Approval

### Step 1: Return to Patient Account
- Log out from doctor account
- Log back in as `testpatient@gmail.com`

### Step 2: Check Assignment Status
- Go to Dashboard
- Look at "Doctor Assignment" section
- **Expected:** Green box appears:
  > ✓ Under supervision  
  > Dr. Test Doctor

### Step 3: Verify Request History
- Scroll down to "Request History"
- **Expected:** Request shows status badge:
  - **approved** (green background)

---

## Test Scenario 4: Doctor Rejects Request

### Setup:
1. Register another patient: `patient2@gmail.com`
2. Send request to the same doctor

### Step 1: Login as Doctor
- Email: `testdoctor@gmail.com`

### Step 2: View New Request
1. Go to **"Requests"** tab
2. See new request from `patient2@gmail.com`

### Step 3: Reject Request
1. Click red **"Reject"** button
2. **Expected:**
   - Request disappears from pending list
   - Patient NOT added to "My Patients"

### Step 4: Verify from Patient Side
1. Log out and log in as `patient2@gmail.com`
2. Check "Request History"
3. **Expected:** Status shows **rejected** (red background)
4. Send Request button should be visible again (can request another doctor)

---

## Test Scenario 5: Prevent Duplicate Requests

### Step 1: Login as Patient (with pending request)
- Use account that already has a pending request

### Step 2: Try to Send Another Request to Same Doctor
1. Select same doctor from dropdown
2. Click "Send Request"
3. **Expected:** Error message appears:
   > "Request already pending with this doctor."

---

## Test Scenario 6: Prevent Requesting Assigned Doctor

### Step 1: Login as Patient (with approved doctor)
- Use `testpatient@gmail.com` (already assigned to Test Doctor)

### Step 2: Check UI
- **Expected:** 
  - Dropdown and Send Request button should be hidden
  - Only green "Under supervision" box visible
  - Cannot send new requests

---

## API Testing (Optional - Using Postman or cURL)

### 1. Patient Sends Request
```bash
POST http://127.0.0.1:8000/patient/request-doctor
Headers:
  Authorization: Bearer <patient_jwt_token>
  Content-Type: application/json
Body:
{
  "doctor_email": "testdoctor@gmail.com"
}
```

**Expected Response:** 200 OK with updated patient object

---

### 2. Get Patient's Requests
```bash
GET http://127.0.0.1:8000/patient/my-requests
Headers:
  Authorization: Bearer <patient_jwt_token>
```

**Expected Response:**
```json
[
  {
    "doctor_id": "6371...",
    "doctor_email": "testdoctor@gmail.com",
    "doctor_name": "Test Doctor",
    "status": "pending",
    "requested_at": "2025-11-09T12:00:00Z"
  }
]
```

---

### 3. Get Doctor's Pending Requests
```bash
GET http://127.0.0.1:8000/doctor/pending-requests
Headers:
  Authorization: Bearer <doctor_jwt_token>
```

**Expected Response:**
```json
[
  {
    "patient_id": "6371...",
    "patient_email": "testpatient@gmail.com",
    "patient_name": "Test Patient",
    "status": "pending",
    "requested_at": "2025-11-09T12:00:00Z"
  }
]
```

---

### 4. Doctor Approves Request
```bash
POST http://127.0.0.1:8000/doctor/respond-request
Headers:
  Authorization: Bearer <doctor_jwt_token>
  Content-Type: application/json
Body:
{
  "patient_email": "testpatient@gmail.com",
  "action": "approve"
}
```

**Expected Response:** 200 OK with updated doctor object

---

### 5. Doctor Rejects Request
```bash
POST http://127.0.0.1:8000/doctor/respond-request
Headers:
  Authorization: Bearer <doctor_jwt_token>
  Content-Type: application/json
Body:
{
  "patient_email": "patient2@gmail.com",
  "action": "reject"
}
```

**Expected Response:** 200 OK with updated doctor object

---

## Database Verification (MongoDB)

### Check Patient Document:
```javascript
db.users.findOne({ email: "testpatient@gmail.com" })
```

**Expected Fields:**
```json
{
  "email": "testpatient@gmail.com",
  "role": "patient",
  "assigned_doctor": "testdoctor@gmail.com",  // After approval
  "doctor_requests": [
    {
      "doctor_id": "...",
      "doctor_email": "testdoctor@gmail.com",
      "doctor_name": "Test Doctor",
      "status": "approved",  // or "pending", "rejected"
      "requested_at": ISODate("2025-11-09T12:00:00Z")
    }
  ]
}
```

### Check Doctor Document:
```javascript
db.users.findOne({ email: "testdoctor@gmail.com" })
```

**Expected Fields:**
```json
{
  "email": "testdoctor@gmail.com",
  "role": "doctor",
  "assigned_patients": ["testpatient@gmail.com"],  // After approval
  "pending_patients": [
    {
      "patient_id": "...",
      "patient_email": "testpatient@gmail.com",
      "patient_name": "Test Patient",
      "status": "approved",  // Changed from "pending"
      "requested_at": ISODate("2025-11-09T12:00:00Z")
    }
  ]
}
```

---

## Expected UI Flow Summary

### Patient View:
1. **No Doctor:** Shows dropdown + "Send Request" button
2. **Request Sent:** Yellow box → "⏳ Request Pending"
3. **Request Approved:** Green box → "✓ Under supervision"
4. **Request Rejected:** Red badge in history, button returns

### Doctor View:
1. **Overview Tab:** See total patients count
2. **Requests Tab:** See all pending requests
3. **After Accept:** Patient appears in "My Patients"
4. **After Reject:** Request removed, patient NOT in list

---

## Troubleshooting

### Issue: "Could not find module '@/components/doctor/PatientRequests'"
**Solution:** 
```bash
cd C:\Alzer\frontend
npm run dev
# Restart Next.js dev server to pick up new file
```

### Issue: 401 Unauthorized on API calls
**Solution:** Ensure JWT token is stored in localStorage and included in headers:
```javascript
headers: { 'Authorization': `Bearer ${token}` }
```

### Issue: Requests tab not appearing
**Solution:** Hard refresh browser (Ctrl + F5) to clear component cache

### Issue: Status not updating after approval
**Solution:** 
1. Check MongoDB to verify fields updated
2. Log out and log back in to refresh user context
3. Check browser console for API errors

---

## Success Criteria

✅ Patient can send request  
✅ Yellow "pending" box appears for patient  
✅ Doctor sees request in "Requests" tab  
✅ Doctor can approve request  
✅ Patient sees green "assigned" box  
✅ Doctor can reject request  
✅ Patient can request again after rejection  
✅ System prevents duplicate pending requests  
✅ MongoDB documents update correctly  

---

## Quick Demo Script

**For Video/Presentation:**

1. **Scene 1 - Patient (30 seconds):**
   - Show patient dashboard
   - Select doctor from dropdown
   - Click "Send Request"
   - Show yellow "pending" box

2. **Scene 2 - Doctor (30 seconds):**
   - Switch to doctor dashboard
   - Click "Requests" tab
   - Show pending request card
   - Click green "Accept" button

3. **Scene 3 - Confirmation (20 seconds):**
   - Switch back to patient view
   - Refresh/re-login
   - Show green "Under supervision" box
   - Show request history with "approved" badge

**Total Demo Time:** ~1.5 minutes

---

**Test Document Version:** 1.0  
**Last Updated:** November 9, 2025  
**Status:** Ready for Testing
