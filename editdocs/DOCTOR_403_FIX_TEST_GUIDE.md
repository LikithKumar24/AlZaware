# Doctor 403 Error Fix - Testing Guide

## Overview
This guide helps you test the 403 error handling improvements for the Doctor High-Risk Review and Patient Detail pages.

## What Was Fixed

### Problem
Doctors were getting 403 AxiosError when trying to view patient data for patients not assigned to them, with no clear error message or recovery path.

### Solution
1. **Proper Error Handling**: Detect 403, 401, 404, and network errors with specific messages
2. **Token Validation**: Check token validity before making requests
3. **Auto-Logout**: Automatically logout on authentication failures (401)
4. **User-Friendly UI**: Show clear error messages with actionable steps
5. **Quick Assignment**: Added "Assign Patient to Me" button on 403 errors

## Test Scenarios

### Scenario 1: Access Unassigned Patient (403 Error)

**Expected Behavior:** The 403 error is now handled gracefully with an option to assign the patient.

**Steps:**
1. Login as a doctor account
2. Navigate to `/patient/[unassigned-patient-email]` 
   - Example: `/patient/testpatient@example.com`
3. **Expected Result:**
   - See amber-colored alert box
   - Message: "Patient Not Assigned"
   - Description explains the patient is not assigned
   - Blue button: "Assign Patient to Me"
   - Tables show message: "Assign this patient to view their assessments/tests"

**Actions to Test:**
1. Click "Assign Patient to Me" button
   - Button should show "Assigning..." while processing
   - After success, data should automatically load
   - Alert should disappear
   - Patient data should display in tables

**Console Logs to Verify:**
```
[PatientDetail] 403 Forbidden - Not authorized to view this patient
[PatientDetail] Response detail: Not authorized to view this patient's data
[PatientDetail] Patient assigned successfully (after clicking button)
[PatientDetail] Data fetched successfully (after assignment)
```

### Scenario 2: Expired Token (401 Error)

**Expected Behavior:** Auto-logout and redirect to login page.

**Steps:**
1. Login as a doctor
2. Manually expire/invalidate the token:
   - Open browser DevTools → Application → Local Storage
   - Modify the `token` value to something invalid
3. Try to access patient detail page or dashboard
4. **Expected Result:**
   - Red error alert: "Your session has expired. Please log in again."
   - After 2 seconds, automatically redirected to login page
   - Token cleared from localStorage

**Console Logs to Verify:**
```
[PatientDetail] 401 Unauthorized - Token expired or invalid
[AuthContext] ====== LOGOUT INITIATED ======
```

### Scenario 3: Normal Flow - Assigned Patient

**Expected Behavior:** Data loads successfully without errors.

**Steps:**
1. Login as a doctor
2. Go to Doctor Dashboard
3. Assign a patient from "All Patients" tab (or use "Patients" tab)
4. Click "View Details" for that patient
5. **Expected Result:**
   - No error messages
   - Loading spinner appears briefly
   - MRI Assessments table shows data (or "No MRI assessments found")
   - Cognitive Tests table shows data (or "No cognitive tests found")

**Console Logs to Verify:**
```
[PatientDetail] Fetching data for patient: patient@example.com
[PatientDetail] Doctor user: doctor@example.com
[PatientDetail] Data fetched successfully
```

### Scenario 4: High-Risk Cases Tab

**Expected Behavior:** High-risk cases load or show appropriate error.

**Steps:**
1. Login as a doctor
2. Go to Doctor Dashboard
3. Click "High-Risk" tab
4. **Expected Result:**
   - If token valid: List of high-risk patients loads
   - If token invalid: Error alert appears with auto-logout
   - No 403 errors (high-risk endpoint doesn't require patient assignment)

**Console Logs to Verify:**
```
[DoctorDashboard] Fetching high-risk cases
```

### Scenario 5: Dashboard Overview Tab

**Expected Behavior:** Dashboard summary loads with assigned patients only.

**Steps:**
1. Login as a doctor
2. View Dashboard Overview tab
3. **Expected Result:**
   - Statistics cards show correct counts
   - "My Patients" section shows only assigned patients
   - Each patient card shows latest MRI and cognitive test results
   - "View Details" button works for each patient

**Console Logs to Verify:**
```
[DoctorDashboard] Fetching dashboard data
```

### Scenario 6: Network Error

**Expected Behavior:** Friendly error message about network issues.

**Steps:**
1. Stop the backend server (or disconnect from network)
2. Try to access patient detail page or dashboard
3. **Expected Result:**
   - Error alert: "Network error. Please check your connection and try again."
   - No crash or blank screen

**Console Logs to Verify:**
```
[PatientDetail] Network or unknown error
Failed to fetch patient data: <network error details>
```

### Scenario 7: Patient Not Found (404)

**Expected Behavior:** Clear message that patient wasn't found.

**Steps:**
1. Navigate to `/patient/nonexistent@email.com`
2. **Expected Result:**
   - Error alert: "Patient data not found."
   - Tables remain visible but empty

## Testing Checklist

### Functionality Tests
- [ ] 403 error shows "Patient Not Assigned" alert with amber styling
- [ ] "Assign Patient to Me" button appears on 403 error
- [ ] Clicking assign button successfully assigns patient and loads data
- [ ] 401 error triggers auto-logout after 2 seconds
- [ ] Token validation happens before API calls
- [ ] Loading spinner shows during data fetch
- [ ] Empty states show appropriate messages
- [ ] Network errors display user-friendly messages
- [ ] 404 errors show "Patient data not found" message

### UI/UX Tests
- [ ] Error alerts use correct colors (amber for 403, red for others)
- [ ] Icons display correctly (AlertCircle, UserPlus)
- [ ] Button loading state shows "Assigning..." text
- [ ] Tables show contextual empty messages based on error state
- [ ] No console errors (except expected ones we're catching)
- [ ] Page doesn't crash on any error type

### Dashboard Tests
- [ ] Overview tab handles 401/403 errors with auto-logout
- [ ] All Patients tab loads correctly
- [ ] High-Risk tab loads correctly
- [ ] Error alerts display at top of content area
- [ ] Assign patient from dashboard works

## Common Issues and Solutions

### Issue: Still getting 403 error even after fix
**Solution:** The 403 error is EXPECTED when accessing unassigned patients. The fix makes it user-friendly with an assign button, not eliminate it.

### Issue: Auto-logout not working
**Solution:** Check that the AuthContext `logout` function is properly imported and working. Verify console shows logout logs.

### Issue: Assign button doesn't work
**Solution:** 
1. Check backend is running on `http://127.0.0.1:8000`
2. Verify `/doctor/assign-patient` endpoint exists
3. Check console for error messages
4. Ensure token is valid

### Issue: Loading state stuck
**Solution:** Check network tab for failed requests. Verify backend is responding.

## Backend Requirements

Ensure these endpoints are working:
1. `GET /assessments/?patient_email={email}` - Requires patient in assigned_patients
2. `GET /cognitive-tests/?patient_email={email}` - Requires patient in assigned_patients
3. `POST /doctor/assign-patient` - Assigns patient to doctor
4. `GET /doctor/dashboard-summary` - Requires doctor role
5. `GET /assessments/high-risk` - Requires doctor role

## Success Criteria

The fix is successful if:
1. ✅ No blank screens or crashes on 403 errors
2. ✅ Clear, actionable error messages displayed
3. ✅ Users can assign patients directly from error screen
4. ✅ Automatic logout works on 401 errors
5. ✅ Console logs provide debugging context
6. ✅ UI remains responsive during all error states
7. ✅ All error types handled gracefully

## Developer Notes

### Key Files Modified
1. `frontend/src/pages/patient/[email].tsx` - Main patient detail page
2. `frontend/src/components/dashboard/DoctorDashboard.tsx` - Main dashboard
3. `frontend/src/components/dashboard/DoctorDashboard_new.tsx` - New dashboard variant

### Error State Design
- **403 (Not Assigned)**: Amber alert with assign button - recoverable
- **401 (Unauthorized)**: Red alert with auto-logout - requires re-login
- **404 (Not Found)**: Red alert - informational only
- **Network**: Red alert - retry-able

### Token Validation Pattern
```typescript
if (!token || token.trim() === '') {
  console.error('[Component] Invalid token detected');
  setError('Authentication token is missing. Please log in again.');
  logout();
  return;
}
```

### Debug Logging
All console logs include component context prefix:
- `[PatientDetail]` - Patient detail page
- `[DoctorDashboard]` - Dashboard component
- `[AuthContext]` - Authentication context

This helps trace issues across components.
