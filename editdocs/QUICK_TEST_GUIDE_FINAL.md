# Quick Test Guide - AlzAware Features

## 🚀 Quick Start

### 1. Start Backend
```bash
cd Modelapi
python -m uvicorn main:app --reload
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

**Access**: http://localhost:3000

---

## ✅ Test Scenarios

### Scenario 1: Doctor 403 Error → Assign Patient
1. **Login as Doctor**
2. **Go to High-Risk tab** or type URL: `http://localhost:3000/patient/some-patient@email.com`
3. **Expected**: If patient not assigned → Yellow "Patient Not Assigned" alert with "Assign Patient to Me" button
4. **Click "Assign Patient to Me"**
5. **Expected**: Patient data loads successfully
6. **✔️ PASS**: No more 403 error

### Scenario 2: Notification Feature
1. **Login as Patient** (patient1@test.com)
2. **Go to View Doctors** → Send supervision request to a doctor
3. **Logout**
4. **Login as Doctor** (the one you requested)
5. **Go to Requests tab** → Click "Approve"
6. **Logout**
7. **Login as Patient again**
8. **Check Dashboard** → Should see notification: "Dr. [Name] has accepted your supervision request"
9. **✔️ PASS**: Notification visible with blue badge

### Scenario 3: Real-Time Chat (Patient → Doctor)
1. **Login as Patient**
2. **Dashboard** → Click green "💬 Chat with Doctor" button
3. **Expected**: Opens `/chat` page with assigned doctor(s) on left sidebar
4. **Click a doctor name**
5. **Type message** → Press Enter or click "Send"
6. **Expected**: Message appears on right side (blue bubble)
7. **✔️ PASS**: Message sent and visible

### Scenario 4: Real-Time Chat (Doctor → Patient)
1. **Login as Doctor** (same doctor from Scenario 3)
2. **Dashboard → Overview tab** → Click "Chat" button next to a patient
3. **Expected**: Opens `/chat` page with assigned patients on left sidebar
4. **Select patient** (the one who messaged you)
5. **Expected**: See previous message from patient
6. **Reply with a message**
7. **Expected**: Message appears on right side (teal bubble)
8. **✔️ PASS**: Both users see messages in real-time

### Scenario 5: Chat Button Visibility (Patient)
1. **Login as Patient** who has an assigned doctor
2. **Dashboard**:
   - ✔️ Green chat button in top header (next to profile)
   - ✔️ Green "Chat with Doctor" button in main 4-card grid
   - ✔️ Green chat banner below notifications
3. **Go to Profile**:
   - ✔️ "💬 Message Your Doctor" section in sidebar
   - ✔️ "Open Chat" button
4. **✔️ PASS**: All 4 chat access points visible

### Scenario 6: View Details Button (Doctor)
1. **Login as Doctor**
2. **Dashboard → Overview tab**
3. **Find "My Patients" section**
4. **Check each patient card**:
   - ✔️ "View Details" button (blue) always visible
   - ✔️ "Chat" button (green) always visible
   - ✔️ Both buttons same size
   - ✔️ Eye icon on "View Details"
   - ✔️ MessageCircle icon on "Chat"
5. **Click "View Details"** → Opens patient detail page
6. **✔️ PASS**: Button works and always visible

### Scenario 7: Token Expiration Handling
1. **Login as Doctor**
2. **Open Developer Tools** → Application tab → Local Storage
3. **Delete the "token" key** (simulates expired token)
4. **Try to view a patient's data**
5. **Expected**: Error message "Your session has expired. Please log in again."
6. **Expected**: Auto-redirect to login after 2 seconds
7. **✔️ PASS**: Graceful logout on invalid token

---

## 🎯 Visual Checks

### Patient Dashboard Should Show:
- ✅ Welcome message with user name
- ✅ Notifications section (with badge if unread)
- ✅ Chat banner (green if doctor assigned, gray if not)
- ✅ 4-card action grid:
  1. Start New Assessment (blue)
  2. **Chat with Doctor (green)** ← Must be visible
  3. View Doctors (outline green)
  4. Results History (outline gray)

### Doctor Dashboard Should Show:
- ✅ Statistics cards (Total Patients, High-Risk, etc.)
- ✅ "My Patients" section with patient cards
- ✅ Each patient card has:
  - Profile photo or initials
  - Latest MRI result with color badge
  - Cognitive test score
  - **"View Details" button (blue, solid)** ← Always visible
  - **"Chat" button (green, solid)** ← Always visible

### Chat Page Should Show:
**Patient View**:
- ✅ Left sidebar: List of assigned doctors
- ✅ Doctor profile photos or initials
- ✅ Latest message preview under each doctor
- ✅ Right side: Chat messages with selected doctor
- ✅ Online/offline status indicator

**Doctor View**:
- ✅ Left sidebar: List of assigned patients
- ✅ Patient profile photos or initials
- ✅ Latest message preview under each patient
- ✅ Right side: Chat messages with selected patient
- ✅ Online/offline status indicator

---

## ❌ Common Issues & Fixes

### Issue 1: "Loading..." stuck in chat
**Fix**: 
- Check if WebSocket is running (backend should be on port 8000)
- Check browser console for errors
- Refresh the page

### Issue 2: No assigned doctors showing for patient
**Fix**:
- Login as doctor
- Go to "Requests" tab
- Approve patient's request

### Issue 3: 403 error still showing after assign
**Fix**:
- Refresh the page
- Check MongoDB - patient email should be in doctor's `assigned_patients` array

### Issue 4: Notifications not showing
**Fix**:
- Check MongoDB collection: `notifications`
- Verify `user_email` matches patient email
- Wait 30 seconds for auto-refresh

### Issue 5: Chat button not visible (patient)
**Cause**: Patient has no assigned doctor
**Fix**: 
- Request doctor supervision from "View Doctors"
- Doctor must approve the request

---

## 🔍 Debug Checklist

If something doesn't work:

### Backend:
```bash
# Check if server is running
curl http://127.0.0.1:8000/docs

# Check WebSocket
wscat -c ws://127.0.0.1:8000/ws/test@email.com
```

### Frontend:
1. Open browser DevTools (F12)
2. Check **Console** tab for errors
3. Check **Network** tab for failed requests
4. Check **Application → Local Storage** for token

### MongoDB:
```javascript
// Check if collections exist
db.users.find()
db.notifications.find()
db.messages.find()
db.assessments.find()
```

---

## 📊 Expected Results Summary

| Test | Expected Result |
|------|----------------|
| **403 Error** | "Assign Patient" button shows, assignment works |
| **Notifications** | Blue badge shows, notification visible, "Mark all read" works |
| **Patient Chat** | Doctor list on left, messages send/receive in real-time |
| **Doctor Chat** | Patient list on left, messages send/receive in real-time |
| **Chat Buttons** | Visible in 4 places for patient, 2 places for doctor |
| **View Details** | Blue button always visible on doctor dashboard |
| **Token Expiry** | Auto-logout with error message |

---

## 🎉 Success Criteria

All features pass if:
- ✅ No 403 errors after assignment
- ✅ Notifications appear when doctor approves
- ✅ Chat works in both directions (doctor ↔ patient)
- ✅ All chat buttons visible to patients
- ✅ "View Details" always visible to doctors
- ✅ No console errors in browser
- ✅ No debug yellow boxes visible

---

**Last Updated**: November 12, 2025  
**All Features**: ✅ Operational
