# Doctor Request-Approval Workflow - Implementation Summary

## Overview
Transformed the AlzAware doctor-patient assignment system from direct assignment to a request-approval workflow where patients send requests to doctors, and doctors can approve or reject them.

---

## Backend Changes (FastAPI)

### 1. Updated Schemas (`main.py`)

#### New Request Schemas:
```python
class DoctorRequest(BaseModel):
    doctor_id: str
    doctor_email: str
    doctor_name: str
    status: str  # 'pending', 'approved', 'rejected'
    requested_at: datetime

class PatientRequest(BaseModel):
    patient_id: str
    patient_email: str
    patient_name: str
    status: str  # 'pending', 'approved', 'rejected'
    requested_at: datetime

class RespondToRequestRequest(BaseModel):
    patient_email: EmailStr
    action: str  # 'approve' or 'reject'
```

#### Updated UserPublic Schema:
```python
class UserPublic(BaseModel):
    # ... existing fields
    assigned_doctor: Optional[str] = None  # NEW for patients
    doctor_requests: Optional[List[dict]] = None  # NEW for patients
    pending_patients: Optional[List[dict]] = None  # NEW for doctors
```

### 2. Database Schema Updates

#### Patient Document:
```json
{
  "email": "patient@example.com",
  "full_name": "Patient Name",
  "role": "patient",
  "assigned_doctor": "doctor@example.com",  // NEW - when approved
  "doctor_requests": [  // NEW - tracks all requests
    {
      "doctor_id": "6371...",
      "doctor_email": "doctor@example.com",
      "doctor_name": "Dr. John Doe",
      "status": "pending",  // or "approved" or "rejected"
      "requested_at": "2025-11-09T12:00:00Z"
    }
  ]
}
```

#### Doctor Document:
```json
{
  "email": "doctor@example.com",
  "full_name": "Dr. John Doe",
  "role": "doctor",
  "assigned_patients": ["patient1@example.com", "patient2@example.com"],
  "pending_patients": [  // NEW - incoming requests
    {
      "patient_id": "6371...",
      "patient_email": "patient@example.com",
      "patient_name": "Patient Name",
      "status": "pending",
      "requested_at": "2025-11-09T12:00:00Z"
    }
  ]
}
```

### 3. New API Endpoints

#### POST `/patient/request-doctor`
**Purpose:** Patient sends a request to a doctor  
**Request Body:**
```json
{
  "doctor_email": "doctor@example.com"
}
```
**Response:** Updated patient UserPublic object  
**Validations:**
- Only patients can request
- Cannot request if already pending with that doctor
- Cannot request if doctor already assigned

**Flow:**
1. Validate doctor exists
2. Check for duplicate pending requests
3. Create request object with "pending" status
4. Add to patient's `doctor_requests` array
5. Add to doctor's `pending_patients` array
6. Return updated patient data

---

#### POST `/doctor/respond-request`
**Purpose:** Doctor approves or rejects a patient request  
**Request Body:**
```json
{
  "patient_email": "patient@example.com",
  "action": "approve"  // or "reject"
}
```
**Response:** Updated doctor UserPublic object  
**Authorization:** Only doctors (uses `require_doctor` dependency)

**Flow:**
1. Validate action is "approve" or "reject"
2. Find patient by email
3. Verify pending request exists
4. Update status in doctor's `pending_patients`
5. Update status in patient's `doctor_requests`
6. **If approved:**
   - Add patient email to doctor's `assigned_patients`
   - Set doctor email as patient's `assigned_doctor`
7. Return updated doctor data

---

#### GET `/patient/my-requests`
**Purpose:** Get patient's request history  
**Response:** List of DoctorRequestPublic objects  
**Authorization:** Only patients

---

#### GET `/doctor/pending-requests`
**Purpose:** Get doctor's pending patient requests (status = "pending" only)  
**Response:** List of PatientRequestPublic objects  
**Authorization:** Only doctors

---

### 4. User Creation Update
```python
if user.role == "doctor":
    user_data["assigned_patients"] = []
    user_data["pending_patients"] = []  # NEW
    user_data["professional_details"] = DoctorProfessionalDetails().model_dump()
elif user.role == "patient":
    user_data["assigned_doctor"] = None  # NEW
    user_data["doctor_requests"] = []  # NEW
```

---

## Frontend Changes (Next.js + React)

### 1. Updated `AssignDoctor.tsx` (Patient Component)

**Path:** `/src/components/patient/AssignDoctor.tsx`

#### New Features:
- **Send Request Button:** Replaces "Assign My Doctor"
- **Status Display:**
  - Green box: Doctor already assigned ("✓ Under supervision")
  - Yellow box: Request pending ("⏳ Request Pending")
  - Green box: Request approved but not yet reflected
- **Request History:** Shows all requests with colored status badges
- **Request Validation:** Prevents duplicate requests

#### UI States:
```tsx
// 1. Assigned Doctor (Green)
<div className="bg-green-50 border border-green-200">
  ✓ Under supervision
  Dr. {assignedDoctorInfo?.full_name}
</div>

// 2. Pending Request (Yellow)
<div className="bg-yellow-50 border border-yellow-200">
  ⏳ Request Pending
  Awaiting approval from Dr. {pendingRequest.doctor_name}
</div>

// 3. Send Request Form (Only if no doctor and no pending)
<Select>
  <SelectItem value={doctor.email}>
    {doctor.full_name} - {specialization}
  </SelectItem>
</Select>
<Button onClick={handleSendRequest}>Send Request</Button>
```

#### API Calls:
```typescript
// Fetch doctors
GET http://127.0.0.1:8000/doctors/all

// Fetch patient's requests
GET http://127.0.0.1:8000/patient/my-requests

// Send request
POST http://127.0.0.1:8000/patient/request-doctor
Body: { doctor_email: selectedDoctor }
```

---

### 2. New `PatientRequests.tsx` (Doctor Component)

**Path:** `/src/components/doctor/PatientRequests.tsx`

#### Purpose:
Display all pending patient requests with Accept/Reject buttons

#### Features:
- **Loading State:** Shows "Loading requests..." while fetching
- **Empty State:** Shows "No pending requests" when none exist
- **Request Cards:**
  - Patient name and email
  - Request timestamp (formatted)
  - Accept button (green)
  - Reject button (red)
- **Processing State:** Disables buttons while responding
- **Auto-refresh:** Re-fetches list after response

#### UI Structure:
```tsx
<Card>
  <CardHeader>
    <Clock icon /> Patient Requests ({count})
  </CardHeader>
  <CardContent>
    {requests.map(request => (
      <div className="border rounded-lg p-4">
        <User icon />
        <h4>{request.patient_name}</h4>
        <p>{request.patient_email}</p>
        <p>Requested: {formatDate(request.requested_at)}</p>
        <Button onClick={() => handleResponse('approve')}>
          <CheckCircle /> Accept
        </Button>
        <Button onClick={() => handleResponse('reject')}>
          <XCircle /> Reject
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
```

#### API Calls:
```typescript
// Fetch pending requests
GET http://127.0.0.1:8000/doctor/pending-requests

// Respond to request
POST http://127.0.0.1:8000/doctor/respond-request
Body: { patient_email: "...", action: "approve" or "reject" }
```

---

### 3. Updated `DoctorDashboard.tsx`

**Path:** `/src/components/dashboard/DoctorDashboard.tsx`

#### Changes:
1. **Import PatientRequests component:**
   ```tsx
   import PatientRequests from '@/components/doctor/PatientRequests';
   import { UserPlus } from 'lucide-react';
   ```

2. **Added "Requests" Tab:**
   ```tsx
   <TabsList className="grid-cols-4">  // Changed from grid-cols-3
     <TabsTrigger value="overview">Overview</TabsTrigger>
     <TabsTrigger value="requests">  // NEW
       <UserPlus icon /> Requests
     </TabsTrigger>
     <TabsTrigger value="all-patients">Patients</TabsTrigger>
     <TabsTrigger value="high-risk">High-Risk</TabsTrigger>
   </TabsList>
   ```

3. **Added Requests TabsContent:**
   ```tsx
   <TabsContent value="requests" className="mt-6">
     <PatientRequests />
   </TabsContent>
   ```

---

## User Workflow

### Patient Flow:

1. **Navigate to Dashboard**
   - See "Doctor Assignment" card/section

2. **No Doctor Assigned:**
   - Select doctor from dropdown
   - Click "Send Request"
   - See success message: "Request sent successfully! Awaiting doctor approval."

3. **Request Pending:**
   - See yellow box: "⏳ Request Pending - Awaiting approval from Dr. [Name]"
   - Send Request button hidden
   - Can view request history below

4. **Request Approved:**
   - See green box: "✓ Under supervision - Dr. [Name]"
   - Dropdown and button hidden
   - Patient can now be monitored by doctor

5. **Request Rejected:**
   - Status badge shows "rejected" in request history
   - Can send new request to another doctor

### Doctor Flow:

1. **Navigate to Dashboard**
   - Click "Requests" tab

2. **View Pending Requests:**
   - See list of patients requesting supervision
   - Each card shows patient name, email, and timestamp

3. **Approve Request:**
   - Click green "Accept" button
   - Patient added to "assigned_patients"
   - Patient's `assigned_doctor` field updated
   - Request removed from pending list

4. **Reject Request:**
   - Click red "Reject" button
   - Request status updated to "rejected"
   - Request removed from pending list
   - Patient can request another doctor

---

## File Structure

```
Alzer/
├── Modelapi/
│   └── main.py                          # MODIFIED - Added request/approval endpoints
│
├── frontend/src/
│   ├── components/
│   │   ├── patient/
│   │   │   └── AssignDoctor.tsx         # MODIFIED - Changed to request workflow
│   │   │
│   │   ├── doctor/
│   │   │   ├── DoctorProfileHeader.tsx  # Existing
│   │   │   └── PatientRequests.tsx      # NEW - Requests management component
│   │   │
│   │   └── dashboard/
│   │       └── DoctorDashboard.tsx      # MODIFIED - Added Requests tab
│   │
│   └── ...
│
└── DOCTOR_REQUEST_APPROVAL_FEATURE.md   # This file
```

---

## API Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/patient/request-doctor` | Patient | Send doctor request |
| POST | `/doctor/respond-request` | Doctor | Approve/reject request |
| GET | `/patient/my-requests` | Patient | Get request history |
| GET | `/doctor/pending-requests` | Doctor | Get pending requests |
| GET | `/doctors/all` | Any | List all doctors |

---

## Status Flow Diagram

```
Patient Action                 Status              Doctor Action
-------------                 ------              -------------
                              
[Send Request] ────────────> pending ───────────> [View in Requests Tab]
                                │
                                │
                    ┌───────────┴───────────┐
                    │                       │
              [Accept]                 [Reject]
                    │                       │
                    ↓                       ↓
                approved                rejected
                    │                       │
                    │                       │
        [assigned_doctor set]      [Can request again]
        [Doctor's assigned_patients updated]
```

---

## Testing Checklist

### Backend:
- [ ] Create patient and doctor accounts
- [ ] Patient sends request → check MongoDB for `doctor_requests` array
- [ ] Doctor receives request → check MongoDB for `pending_patients` array
- [ ] Doctor approves → verify `assigned_doctor` and `assigned_patients` updated
- [ ] Doctor rejects → verify status changed to "rejected"
- [ ] Test duplicate request prevention
- [ ] Test requesting already-assigned doctor

### Frontend:
- [ ] Patient dashboard shows "Send Request" button
- [ ] Dropdown lists all doctors
- [ ] Request sent → success message displays
- [ ] Pending status appears (yellow box)
- [ ] Doctor dashboard "Requests" tab visible
- [ ] Pending requests load correctly
- [ ] Accept button → request disappears
- [ ] Reject button → request disappears
- [ ] Patient sees approval status update
- [ ] Request history displays correctly

---

## Benefits of New System

1. **Two-Way Consent:** Doctors control their patient load
2. **Professional Boundaries:** Prevents unwanted assignments
3. **Audit Trail:** Full request history for both parties
4. **Clear Status:** Users always know request state
5. **Scalability:** Doctors can manage multiple pending requests
6. **User Experience:** Intuitive workflow with visual feedback

---

## Future Enhancements

1. **Notifications:** Email/push notifications for new requests
2. **Request Messages:** Allow patients to add a message with request
3. **Doctor Capacity:** Limit number of patients per doctor
4. **Auto-Rejection:** Expire old pending requests after 30 days
5. **Request Analytics:** Track acceptance rates, response times
6. **Priority Requests:** High-risk patients get priority routing
7. **Bulk Actions:** Doctors approve/reject multiple requests at once
8. **Request Filters:** Filter by request date, patient demographics

---

## Migration Notes

**For Existing Databases:**

If you have existing users in the database, run a migration script to add the new fields:

```python
# MongoDB migration script
async def migrate_users():
    # Update all patients
    await user_collection.update_many(
        {"role": "patient"},
        {
            "$set": {
                "assigned_doctor": None,
                "doctor_requests": []
            }
        }
    )
    
    # Update all doctors
    await user_collection.update_many(
        {"role": "doctor"},
        {
            "$set": {
                "pending_patients": []
            }
        }
    )
```

---

## Deployment Steps

1. **Backend:**
   ```bash
   cd Modelapi
   # Install dependencies (no new ones needed)
   # Start server
   uvicorn main:app --reload
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install  # No new dependencies needed
   npm run dev
   ```

3. **Database:**
   - No manual migration needed
   - New fields auto-created on user registration
   - Existing users: Run migration script if needed

---

## Troubleshooting

### Issue: "Request already pending" error
**Solution:** Check patient's `doctor_requests` array in MongoDB. Clear pending status if stuck.

### Issue: Requests not appearing in doctor dashboard
**Solution:** Verify `pending_patients` array in doctor document. Check tab is set to "requests".

### Issue: Approval doesn't update patient
**Solution:** Verify `/doctor/respond-request` endpoint updates both `assigned_patients` and `assigned_doctor` fields.

### Issue: Doctor dropdown empty
**Solution:** Verify `/doctors/all` endpoint returns doctors with correct schema.

---

## Conclusion

The request-approval workflow is now fully implemented end-to-end. Patients can send requests to doctors, doctors can approve or reject them, and both parties have clear visibility into the status of all requests. The system maintains data consistency across both the patient and doctor documents, ensuring accurate tracking of assignments and request history.

---

**Document Version:** 1.0  
**Last Updated:** November 9, 2025  
**Author:** GitHub Copilot CLI  
**Project:** AlzAware - Alzheimer's Detection Platform
