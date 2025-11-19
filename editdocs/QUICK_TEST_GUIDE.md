# Quick Test Guide - AlzAware Features

## Prerequisites
```bash
# Terminal 1 - Backend
cd C:\Alzer\Modelapi
python -m uvicorn main:app --reload

# Terminal 2 - Frontend
cd C:\Alzer\frontend
npm run dev
```

Access the app at: http://localhost:3000

---

## Test 1: Fix 403 Error (Doctor Viewing Patient Data)

### Steps:
1. **Login as Doctor**
   - Email: `doctor@example.com`
   - Password: `[your_doctor_password]`

2. **Navigate to High-Risk Review**
   - Dashboard → "High-Risk Cases" section
   - Click "View Details" on any patient

3. **Expected Behavior:**
   - ❌ **Before Fix**: 403 error, no data shown
   - ✅ **After Fix**: Either data loads OR "Assign Patient to Me" button appears

4. **If Patient Not Assigned:**
   - Click "Assign Patient to Me" button
   - Wait for confirmation
   - Data should now load successfully

5. **Console Logs to Check:**
   ```
   [PatientDetail] Fetching data for patient: patient@example.com
   [PatientDetail] Doctor user: doctor@example.com
   [PatientDetail] Data fetched successfully
   ```

### What Was Fixed:
- Added proper token validation before API calls
- Enhanced error handling for 401/403 errors
- Added "Assign Patient" functionality with retry logic
- Improved user feedback with specific error messages

---

## Test 2: Notification System

### Setup:
1. Create two accounts:
   - Patient: `patient1@test.com`
   - Doctor: `doctor1@test.com`

### Test Flow:

#### Part A: Patient Sends Request
1. **Login as Patient** (`patient1@test.com`)
2. Go to "View Doctors" page
3. Click "Request Supervision" on `doctor1@test.com`
4. Verify request sent successfully

#### Part B: Doctor Approves Request
1. **Logout and Login as Doctor** (`doctor1@test.com`)
2. Go to Dashboard → "Pending Requests" section
3. Click "Approve" for `patient1@test.com`
4. Check backend console:
   ```
   [Notification] Created notification for patient patient1@test.com
   ```

#### Part C: Patient Receives Notification
1. **Logout and Login as Patient** (`patient1@test.com`)
2. Check sidebar or notification area
3. **Expected:** Blue notification box showing:
   ```
   Dr. [Doctor Name] has accepted your supervision request.
   ```
4. Click on notification or mark as read
5. Notification should turn gray or disappear

### API Endpoints Used:
- `POST /patient/request-doctor` - Send request
- `POST /doctor/respond-request` - Approve/reject
- `GET /notifications/` - Fetch notifications
- `PATCH /notifications/mark-read` - Mark as read

### MongoDB Verification:
```javascript
// Check notifications collection
db.notifications.find({ user_email: "patient1@test.com" })

// Expected document:
{
  _id: ObjectId("..."),
  user_email: "patient1@test.com",
  message: "Dr. John Smith has accepted your supervision request.",
  type: "doctor_acceptance",
  status: "unread", // changes to "read" after viewing
  timestamp: ISODate("2025-11-12T12:00:00Z")
}
```

---

## Test 3: Real-Time Chat Feature

### Test 3A: Patient-Side Chat with Doctor List

#### Steps:
1. **Login as Patient** (`patient1@test.com`)
2. Ensure doctor is assigned (see Test 2)
3. **Option 1: Click "Chat" in Header**
   - Top navigation bar → "💬 Chat" button
   
4. **Option 2: Click "Open Chat" in Profile**
   - Go to Profile page
   - Find green "Message Your Doctor" banner
   - Click "Open Chat" button

5. **Expected UI:**
   ```
   ┌─────────────────┬────────────────────────────┐
   │ Your Doctors    │ Chat with Dr. Smith        │
   │                 │                            │
   │ ✓ Dr. Smith     │ [Messages appear here]     │
   │   Neurologist   │                            │
   │   "Hello..."    │                            │
   │                 │                            │
   │   Dr. Johnson   │ [Type message box]         │
   │   Cardiologist  │ [Send button]              │
   └─────────────────┴────────────────────────────┘
   ```

6. **Test Doctor Selection:**
   - Click different doctors in left sidebar
   - Chat area should update with that doctor's conversation
   - Messages should load from MongoDB

7. **Test Sending Messages:**
   - Type "Hello Doctor" in input box
   - Click "Send" or press Enter
   - Message should appear on right side (blue bubble)
   - Check "Online" status indicator (green dot)

### Test 3B: Doctor-Side Chat

#### Steps:
1. **Login as Doctor** (`doctor1@test.com`)
2. Click "💬 Chat" in header
3. **Open Chat from Dashboard:**
   - Find patient card
   - Click "Chat" button
   - URL: `/chat?email=patient1@test.com`

4. **Expected UI:**
   - Single chat interface (no sidebar)
   - Patient name shown in header
   - Online/Offline status
   - Previous messages loaded

5. **Test Sending Messages:**
   - Type "Hello Patient" 
   - Click Send
   - Message appears on right (blue bubble)

### Test 3C: Real-Time Messaging

#### Setup:
1. Open two browser windows (or incognito + normal)
2. Window 1: Login as Patient
3. Window 2: Login as Doctor

#### Test Steps:
1. **Both users open chat with each other:**
   - Patient: `/chat` → Select doctor
   - Doctor: `/chat?email=patient@test.com`

2. **Send message from Patient:**
   - Type "Hello" and send
   - **Check Doctor's window:** Message appears INSTANTLY (no refresh)

3. **Send message from Doctor:**
   - Type "Hi, how are you?" and send
   - **Check Patient's window:** Message appears INSTANTLY

4. **Verify WebSocket Connection:**
   - Open DevTools → Network tab → WS filter
   - Should see: `ws://127.0.0.1:8000/ws/[email]`
   - Status: 101 Switching Protocols (green)

5. **Test Message Persistence:**
   - Close both windows
   - Reopen and login again
   - All messages should still be there

### Expected Console Logs:
```javascript
// Patient side
[Chat] Fetching assigned doctors for patient: patient1@test.com
[Chat] Assigned doctors: [{email: "doctor1@test.com", ...}]
[Chat] Selected doctor: {email: "doctor1@test.com", ...}
[WebSocket] Connecting for user: patient1@test.com
[WebSocket] Connected successfully
[WebSocket] Ready state: 1
[Chat] Fetching messages between: patient1@test.com and doctor1@test.com
[Chat] Loaded 5 messages
[WebSocket] Received message: {sender_email: "doctor1@test.com", ...}
[WebSocket] Adding message to chat

// Doctor side
[WebSocket] Connecting for user: doctor1@test.com
[WebSocket] Connected successfully
[Chat] Fetching messages between: doctor1@test.com and patient1@test.com
[WebSocket] Sent message: {receiver_email: "patient1@test.com", message: "Hello"}
```

---

## Test 4: Chat Feature Visibility

### Patient Dashboard Checks:

#### A. Profile Page (`/patient/profile`)
- [ ] Green "Message Your Doctor" banner visible
- [ ] Shows "Dr. [Name] • Real-time chat available"
- [ ] "Open Chat" button clickable
- [ ] If no doctor: Gray box with "No doctor assigned yet"

#### B. Header Navigation
- [ ] "💬 Chat" button visible in top nav
- [ ] Text color: green
- [ ] Hover effect works
- [ ] Clicking opens `/chat` page

#### C. Doctor List Sidebar (Chat Page)
- [ ] Shows all assigned doctors
- [ ] Profile pictures or initials displayed
- [ ] Specialization shown
- [ ] Latest message preview visible
- [ ] Selected doctor highlighted (green border)

### Doctor Dashboard Checks:

#### A. Header Navigation
- [ ] "💬 Chat" button visible
- [ ] Works same as patient side

#### B. Patient Cards
- [ ] Each patient card has "Chat" button
- [ ] Clicking opens `/chat?email=[patient_email]`

---

## Test 5: Error Handling & Edge Cases

### A. Token Expiry
1. Login as any user
2. Manually expire token in localStorage:
   ```javascript
   // In browser console
   localStorage.setItem('token', 'invalid_token')
   ```
3. Try to access chat or patient data
4. **Expected:** Redirect to login with error message

### B. WebSocket Disconnection
1. Open chat page
2. Stop backend server (`Ctrl+C`)
3. Try sending message
4. **Expected:** 
   - Status changes to "Offline" (red dot)
   - Error message: "Connection lost. Please refresh the page."
   - Send button disabled

### C. No Assigned Doctor (Patient)
1. Login as new patient with no doctor
2. Go to `/chat`
3. **Expected:**
   - Left sidebar shows "No assigned doctors yet"
   - "View Doctors" button visible
   - Main area shows "No doctor selected"

### D. Unassigned Patient (Doctor)
1. Login as doctor
2. Try to access `/patient/[unassigned_email]`
3. **Expected:**
   - Yellow warning banner
   - "Patient Not Assigned" message
   - "Assign Patient to Me" button
   - No patient data visible

---

## Test 6: Data Persistence

### MongoDB Verification:

#### Check Messages Collection:
```javascript
db.messages.find({
  $or: [
    {sender_email: "patient1@test.com", receiver_email: "doctor1@test.com"},
    {sender_email: "doctor1@test.com", receiver_email: "patient1@test.com"}
  ]
}).sort({timestamp: -1})
```

#### Check Notifications Collection:
```javascript
db.notifications.find({user_email: "patient1@test.com"}).sort({timestamp: -1})
```

#### Check User Assignment:
```javascript
// Doctor document
db.users.findOne({email: "doctor1@test.com"})
// Should have: assigned_patients: ["patient1@test.com"]

// Patient document
db.users.findOne({email: "patient1@test.com"})
// Should have: assigned_doctor: "doctor1@test.com"
```

---

## Troubleshooting

### Issue: Chat messages not sending
**Solution:**
1. Check WebSocket connection in DevTools
2. Verify backend is running: `http://127.0.0.1:8000/`
3. Check console for errors
4. Restart both frontend and backend

### Issue: 403 error persists
**Solution:**
1. Check patient is in doctor's `assigned_patients` array
2. Clear localStorage and re-login
3. Verify JWT token is valid
4. Check backend logs for authorization errors

### Issue: Notifications not showing
**Solution:**
1. Verify doctor approved the request
2. Check MongoDB notifications collection
3. Refresh page or re-login
4. Check `/notifications/` API endpoint in Network tab

### Issue: Doctor list empty (patient)
**Solution:**
1. Ensure doctor has approved patient's request
2. Check patient's `assigned_doctor` field in MongoDB
3. Check doctor's `assigned_patients` array
4. Verify `/doctors/all` API returns data

---

## Performance Checks

### Page Load Times:
- [ ] Chat page loads in < 2 seconds
- [ ] Messages fetch in < 1 second
- [ ] WebSocket connects in < 500ms
- [ ] Doctor list loads in < 1 second

### Real-Time Delivery:
- [ ] Messages appear in < 100ms
- [ ] No message loss
- [ ] Messages persist after refresh
- [ ] Date grouping works correctly

### UI Responsiveness:
- [ ] Smooth scrolling
- [ ] No lag when typing
- [ ] Buttons respond immediately
- [ ] Sidebar selection updates instantly

---

## Success Criteria

✅ All 6 tests pass without errors  
✅ No console errors or warnings  
✅ WebSocket connection stable  
✅ Messages persist in MongoDB  
✅ Notifications work end-to-end  
✅ 403 errors resolved  
✅ UI matches requirements  
✅ Real-time delivery < 100ms  

---

## Final Verification Checklist

### Backend:
- [ ] All endpoints returning 200 OK
- [ ] WebSocket connections active
- [ ] MongoDB collections populated
- [ ] Console logs clean (no errors)

### Frontend:
- [ ] No 404s in Network tab
- [ ] All API calls successful
- [ ] WebSocket status: 101
- [ ] UI rendering correctly

### Features:
- [ ] Doctor can view patient data (after assignment)
- [ ] Patients receive notifications
- [ ] Chat works both directions
- [ ] Messages load from history
- [ ] Real-time updates work
- [ ] All buttons/links functional

---

## Test Results Template

```
Date: __________
Tester: __________

Test 1 (403 Fix): ☐ Pass ☐ Fail
Test 2 (Notifications): ☐ Pass ☐ Fail
Test 3A (Patient Chat): ☐ Pass ☐ Fail
Test 3B (Doctor Chat): ☐ Pass ☐ Fail
Test 3C (Real-Time): ☐ Pass ☐ Fail
Test 4 (Visibility): ☐ Pass ☐ Fail
Test 5 (Error Handling): ☐ Pass ☐ Fail
Test 6 (Persistence): ☐ Pass ☐ Fail

Overall Status: ☐ All Pass ☐ Some Failures

Notes:
_________________________________
_________________________________
```
