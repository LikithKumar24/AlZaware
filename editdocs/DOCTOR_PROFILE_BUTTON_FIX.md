# Doctor Profile "Assign as My Doctor" Button Fix

## Issue
On the doctor profile page (`/doctor/[id]`), the "Assign as My Doctor" button appeared for all patients, even if:
- The patient was already assigned to that doctor
- The patient had a pending request to that doctor
- The patient's previous request was rejected

This caused backend errors when patients tried to send duplicate requests.

## Root Cause
The button rendering logic didn't check the patient's current relationship status with the doctor before displaying the button. It showed the same "Assign as My Doctor" button for all states.

## Solution Implemented

### 1. Added Patient Data Fetching
- Created a new `PatientData` interface to store patient assignment status
- Added `fetchPatientData()` function that calls `/users/me` endpoint
- Stores `assigned_doctor` (email) and `doctor_requests` (array) in state
- Added console logs for debugging patient status

### 2. Updated Button Logic with Conditional Rendering
The button now shows different states based on the patient's relationship:

#### ✅ **Under Supervision** (Green Button - Disabled)
- Shown when: `patientData.assigned_doctor === doctor.email`
- Text: "✓ Under Supervision"
- Style: Green background with green border
- Icon: CheckCircle

#### ⏳ **Request Pending** (Yellow Button - Disabled)
- Shown when: Patient has a pending request to this doctor
- Text: "⏳ Request Pending"
- Style: Yellow background with yellow border
- Icon: Clock

#### 🔄 **Request Again** (Blue Button - Clickable)
- Shown when: Patient's previous request was rejected
- Text: "Request Again"
- Action: Sends new doctor request
- Style: Blue background, hover effects

#### ➕ **Assign as My Doctor** (Blue Button - Clickable)
- Shown when: No existing relationship with this doctor
- Text: "Assign as My Doctor"
- Action: Sends doctor request
- Style: Blue background, hover effects

### 3. Added Request Prevention Logic
In the `sendDoctorRequest()` function:
```typescript
const isUnderSupervision = patientData?.assigned_doctor === doctor.email;
const isPending = patientData?.doctor_requests?.some(
  r => r.doctor_id === doctorId && r.status === 'pending'
);

if (isUnderSupervision || isPending) {
  console.log('Request blocked: Already assigned or pending');
  return;
}
```

This prevents duplicate API calls even if the button is somehow clicked.

### 4. Updated Request Handling
- Changed from `POST /patient/assign-doctor` to `POST /patient/request-doctor`
- Now uses the request-approval workflow instead of direct assignment
- Updates local patient state immediately after successful request
- Shows appropriate success/error messages

## Files Modified

### `frontend/src/pages/doctor/[id].tsx`

**Changes:**
1. Added `PatientData` interface (lines 48-55)
2. Added `patientData` state variable (line 62)
3. Added `fetchPatientData()` function (lines 106-128)
4. Updated `useEffect` to call `fetchPatientData()` for patients (lines 73-75)
5. Renamed `handleAssignDoctor` to `sendDoctorRequest` with duplicate prevention (lines 130-169)
6. Completely rewrote button rendering with conditional logic (lines 306-358)

**Key Code Sections:**

```typescript
// Fetch patient data on mount
const fetchPatientData = async () => {
  if (!token) return;
  
  try {
    const response = await fetch('http://127.0.0.1:8000/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("patient.assigned_doctor:", data.assigned_doctor);
      console.log("patient.doctor_requests:", data.doctor_requests);
      setPatientData({
        assigned_doctor: data.assigned_doctor,
        doctor_requests: data.doctor_requests || [],
      });
    }
  } catch (error) {
    console.error('Error fetching patient data:', error);
  }
};

// Send doctor request with duplicate prevention
const sendDoctorRequest = async (doctorId: string) => {
  if (!token || !doctor) return;
  
  // Prevent duplicate requests
  const isUnderSupervision = patientData?.assigned_doctor === doctor.email;
  const isPending = patientData?.doctor_requests?.some(
    r => r.doctor_id === doctorId && r.status === 'pending'
  );
  
  if (isUnderSupervision || isPending) {
    console.log('Request blocked: Already assigned or pending');
    return;
  }
  
  setAssigningDoctor(true);
  try {
    const response = await fetch('http://127.0.0.1:8000/patient/request-doctor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ doctor_email: doctor.email }),
    });

    if (response.ok) {
      const updatedPatient = await response.json();
      setPatientData({
        assigned_doctor: updatedPatient.assigned_doctor,
        doctor_requests: updatedPatient.doctor_requests || [],
      });
      alert(`Request sent to Dr. ${doctor.full_name}!`);
    } else {
      const error = await response.json();
      alert(error.detail || 'Failed to send request. Please try again.');
    }
  } catch (error) {
    console.error('Error sending request:', error);
    alert('An error occurred. Please try again.');
  } finally {
    setAssigningDoctor(false);
  }
};

// Conditional button rendering
{user?.role === 'patient' && doctor && (() => {
  const isUnderSupervision = patientData?.assigned_doctor === doctor.email;
  const isPending = patientData?.doctor_requests?.some(
    r => r.doctor_id === doctor._id && r.status === 'pending'
  );
  const isRejected = patientData?.doctor_requests?.some(
    r => r.doctor_id === doctor._id && r.status === 'rejected'
  );

  if (isUnderSupervision) {
    return (
      <Button 
        disabled
        className="bg-green-50 text-green-800 border-2 border-green-300 shadow-lg px-8 py-6 text-lg cursor-not-allowed hover:bg-green-50"
      >
        <CheckCircle className="h-5 w-5 mr-3" />
        ✓ Under Supervision
      </Button>
    );
  } else if (isPending) {
    return (
      <Button 
        disabled
        className="bg-yellow-50 text-yellow-800 border-2 border-yellow-300 shadow-lg px-8 py-6 text-lg cursor-not-allowed hover:bg-yellow-50"
      >
        <Clock className="h-5 w-5 mr-3" />
        ⏳ Request Pending
      </Button>
    );
  } else if (isRejected) {
    return (
      <Button 
        onClick={() => sendDoctorRequest(doctor._id)}
        disabled={assigningDoctor}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
      >
        <Users className="h-5 w-5 mr-3" />
        {assigningDoctor ? 'Sending Request...' : 'Request Again'}
      </Button>
    );
  } else {
    return (
      <Button 
        onClick={() => sendDoctorRequest(doctor._id)}
        disabled={assigningDoctor}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
      >
        <Users className="h-5 w-5 mr-3" />
        {assigningDoctor ? 'Sending Request...' : 'Assign as My Doctor'}
      </Button>
    );
  }
})()}
```

## Backend Dependencies
The fix relies on these existing backend endpoints:

1. **`GET /users/me`** - Returns current user data including:
   - `assigned_doctor` (string: doctor's email)
   - `doctor_requests` (array of request objects)

2. **`POST /patient/request-doctor`** - Sends doctor request:
   - Body: `{ doctor_email: string }`
   - Returns: Updated patient object with new request

3. **`POST /doctor/respond-request`** - Doctor approves/rejects (not modified):
   - Updates request status in both patient and doctor records
   - Sets `assigned_doctor` field when approved

## Testing Checklist

### Scenario 1: New Patient (No relationship)
- [ ] Visit doctor profile page
- [ ] Button shows: "Assign as My Doctor" (blue, clickable)
- [ ] Click button
- [ ] Request sent successfully
- [ ] Button changes to: "⏳ Request Pending" (yellow, disabled)
- [ ] Console shows patient.assigned_doctor and patient.doctor_requests

### Scenario 2: Pending Request
- [ ] Patient already sent request (status: pending)
- [ ] Button shows: "⏳ Request Pending" (yellow, disabled)
- [ ] Button is not clickable
- [ ] No duplicate requests can be sent

### Scenario 3: Already Assigned
- [ ] Patient already assigned to this doctor
- [ ] Button shows: "✓ Under Supervision" (green, disabled)
- [ ] Button is not clickable
- [ ] Console shows assigned_doctor matches current doctor

### Scenario 4: Rejected Request
- [ ] Patient's previous request was rejected
- [ ] Button shows: "Request Again" (blue, clickable)
- [ ] Click button
- [ ] New request sent successfully
- [ ] Button changes to: "⏳ Request Pending"

### Scenario 5: Doctor Approval Flow
- [ ] Patient sends request
- [ ] Doctor approves via their dashboard
- [ ] Patient refreshes doctor profile page
- [ ] Button shows: "✓ Under Supervision" (green, disabled)

## Browser Console Debugging
When the page loads, check console for:
```
patient.assigned_doctor: doctor@example.com (or null)
patient.doctor_requests: [{doctor_id: "...", status: "pending"}, ...]
```

If request is blocked:
```
Request blocked: Already assigned or pending
```

## UI States Summary

| Patient Status | Button Text | Button Color | Icon | Clickable |
|----------------|-------------|--------------|------|-----------|
| No relationship | "Assign as My Doctor" | Blue | Users | ✅ Yes |
| Pending request | "⏳ Request Pending" | Yellow | Clock | ❌ No |
| Already assigned | "✓ Under Supervision" | Green | CheckCircle | ❌ No |
| Rejected request | "Request Again" | Blue | Users | ✅ Yes |

## Known Limitations
1. Button state updates only on page load or after successful request
2. If another user (admin) changes the assignment status, current patient must refresh to see update
3. No real-time updates via WebSocket - relies on API polling/refresh

## Future Improvements
1. Add real-time updates using WebSocket for instant status changes
2. Add toast notifications instead of alert()
3. Show request date/time in "Request Pending" state
4. Add "Cancel Request" option for pending requests
5. Show rejection reason if doctor provides one

## Related Files
- Backend: `Modelapi/main.py` (endpoints: /users/me, /patient/request-doctor)
- Context: `frontend/src/context/AuthContext.tsx` (provides token)
- Dashboard: `frontend/src/components/patient/AssignDoctor.tsx` (similar logic)

## Deployment Notes
- No database migration needed (fields already exist)
- No new environment variables required
- No new dependencies added
- Frontend hot-reload should pick up changes automatically
- Backend server does not need restart (no changes to backend)

## Support
If button still appears incorrectly after applying this fix:
1. Check browser console for patient data logs
2. Verify `/users/me` endpoint returns `assigned_doctor` and `doctor_requests`
3. Ensure patient data updates after backend approval
4. Clear localStorage and re-login if user context is stale
5. Check network tab for 401 errors (token expiration)

---
**Fix Applied:** 2025-11-10  
**Issue:** Doctor profile button appears even when already assigned  
**Status:** ✅ Resolved
