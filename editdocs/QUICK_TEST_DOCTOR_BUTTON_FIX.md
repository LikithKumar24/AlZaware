# Quick Test Guide: Doctor Profile Button Fix

## What Was Fixed
The "Assign as My Doctor" button on the doctor profile page now shows the correct state based on the patient's relationship with the doctor.

## Test Steps

### Step 1: Start the Application
```bash
# Terminal 1: Start backend
cd Modelapi
python -m uvicorn main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 2: Login as Patient
1. Go to `http://localhost:3000/login`
2. Login with your patient account (e.g., `testing@gmail.com` / `test@123`)

### Step 3: Navigate to View Doctors
1. From patient dashboard, click "View Doctors" in sidebar
2. Click "View Full Profile" on any doctor card

### Step 4: Test Button States

#### Test A: New Relationship (First Time)
**Expected:** Button shows "Assign as My Doctor" (blue, clickable)

1. Click "Assign as My Doctor"
2. **Expected:** Alert shows "Request sent to Dr. [Name]!"
3. **Expected:** Button changes to "⏳ Request Pending" (yellow, disabled)
4. **Expected:** Button is no longer clickable

#### Test B: Pending Request
**Expected:** Button shows "⏳ Request Pending" (yellow, disabled)

1. Refresh the page
2. **Expected:** Button still shows "⏳ Request Pending"
3. Try clicking the button
4. **Expected:** Nothing happens (button is disabled)

#### Test C: After Doctor Approves
1. Logout from patient account
2. Login as doctor
3. Go to "Requests" tab
4. Click "Accept" on the patient's request
5. Logout from doctor account
6. Login back as patient
7. Go to the same doctor profile page
8. **Expected:** Button shows "✓ Under Supervision" (green, disabled)

#### Test D: Rejected Request (Manual Test)
If you want to test the "Request Again" button:
1. Have a doctor reject your request
2. Visit that doctor's profile page
3. **Expected:** Button shows "Request Again" (blue, clickable)
4. Click "Request Again"
5. **Expected:** New request sent, button changes to "⏳ Request Pending"

### Step 5: Check Console Logs
Open browser DevTools (F12) and check console for:
```
patient.assigned_doctor: [email or null]
patient.doctor_requests: [array of request objects]
```

If you try to click when already assigned/pending:
```
Request blocked: Already assigned or pending
```

## Visual Reference

### Button States
| State | Color | Text | Icon | Clickable |
|-------|-------|------|------|-----------|
| New | Blue | "Assign as My Doctor" | 👥 | ✅ |
| Pending | Yellow | "⏳ Request Pending" | ⏰ | ❌ |
| Assigned | Green | "✓ Under Supervision" | ✔️ | ❌ |
| Rejected | Blue | "Request Again" | 👥 | ✅ |

## Troubleshooting

### Button doesn't change after clicking
- Check browser console for errors
- Check Network tab → verify POST to `/patient/request-doctor` succeeded
- Verify response includes updated `doctor_requests` array

### Button shows "Assign as My Doctor" when already assigned
- Clear localStorage: `localStorage.clear()`
- Re-login to refresh user context
- Check console → verify `patient.assigned_doctor` is set correctly

### 401 Unauthorized error
- Token may be expired
- Logout and login again
- Check that `Authorization: Bearer [token]` header is present in request

### Backend error: "Request already pending"
- This means the fix is working!
- The backend is preventing duplicate requests
- Refresh the page to see the correct button state

## Success Criteria
✅ Button shows different text/color based on relationship status  
✅ Cannot click "Under Supervision" or "Request Pending" buttons  
✅ No duplicate requests can be sent  
✅ Button updates immediately after sending request  
✅ Console logs show correct patient data  

## Files Changed
- `frontend/src/pages/doctor/[id].tsx` - Updated button logic

## No Backend Changes Needed
The backend already had the correct endpoints (`/users/me`, `/patient/request-doctor`).  
This fix only updates the frontend logic.

---
**Status:** Ready for testing  
**Time to test:** ~5 minutes
