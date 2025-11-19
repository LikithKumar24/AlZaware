# Quick Test Guide for AlzAware Fixes

## 🚀 Quick Start Testing

### Prerequisites
1. Backend running on `http://127.0.0.1:8000`
2. Frontend running on `http://localhost:3000`
3. Two test accounts:
   - Patient: `patient@test.com`
   - Doctor: `doctor@test.com`

---

## Test 1: 403 Error Fix (2 minutes)

### Steps:
```bash
1. Login as: doctor@test.com
2. Navigate to: Dashboard
3. Click: "High Risk Review" tab (or any patient detail link)
4. Result: One of these should happen:
   ✅ Patient data loads successfully
   ✅ "Assign Patient to Me" button appears (with amber warning)
   ✅ NO generic 403 error message

5. If "Assign Patient" button shows:
   - Click it
   - Data should load after ~2 seconds
   - 403 error should disappear
```

### Expected Console Logs:
```
[PatientDetail] Fetching data for patient: patient@test.com
[PatientDetail] Token verified, user: doctor@test.com
[PatientDetail] Data fetched successfully
```

### ❌ Failure Signs:
- Red error: "Request failed with status code 403"
- No "Assign Patient" button on 403
- Page stuck on "Loading..."

---

## Test 2: Notification System (3 minutes)

### Steps:
```bash
# Setup (as patient)
1. Login as: patient@test.com
2. Go to: View Doctors page
3. Select any doctor
4. Click: "Send Request"
5. Logout

# Approve (as doctor)
6. Login as: doctor@test.com
7. Go to: Dashboard → Requests tab
8. Find patient request
9. Click: "Approve"
10. Logout

# Verify (as patient)
11. Login as: patient@test.com
12. Go to: Dashboard
13. Look at sidebar → "Notifications" section
```

### ✅ Expected Result:
```
Notifications
━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Dr. [Doctor Name] has accepted your supervision request.
  [Just now]

[Mark all as read]
```

### Test Mark as Read:
```bash
14. Click: "Mark all as read"
15. Notification should:
    - Disappear OR
    - Change color to gray/read state
```

### ❌ Failure Signs:
- No notifications section
- "Notifications" heading but empty
- Request approved but notification missing
- "Mark as read" doesn't work

---

## Test 3: Real-Time Chat (5 minutes)

### Patient Side Test:
```bash
1. Login as: patient@test.com (with assigned doctor)
2. Look for chat buttons in these places:
   a) Dashboard header (top-right) → "💬 Chat with Dr. [Name]"
   b) Dashboard banner (green, below notifications)
   c) Dashboard action grid (green button next to "Results History")
   d) Profile page (below "Your Medical Team")

3. Click any chat button
4. Should open: /chat page
5. Left sidebar should show:
   - "Your Doctors" heading
   - List of assigned doctors with photos
   - Doctor name and specialization

6. Click on a doctor
7. Right side should show:
   - Doctor name in header
   - "Online" status (green dot)
   - Empty chat area or message history

8. Type: "Hello, I need help with my results"
9. Press: Enter (or click Send)
10. Message should appear:
    - Right side (green bubble)
    - Your message text
    - Timestamp below
```

### Doctor Side Test:
```bash
11. Keep patient chat open
12. Open new browser window/incognito
13. Login as: doctor@test.com
14. Go to: /chat (or click Chat in navigation)
15. Left sidebar should show:
    - "My Patients" heading
    - List of assigned patients

16. Click the patient you just messaged
17. Right side should show:
    - Patient's message: "Hello, I need help with my results"
    - Message on left side (white bubble)

18. Type: "I'm here to help. What do you need?"
19. Press: Enter
20. Message should appear:
    - Right side (teal bubble)
    - Your message text

21. Switch to patient window
22. Patient should see doctor's message:
    - Left side (white bubble)
    - Instantly (no refresh needed)
```

### ✅ Expected Behavior:
- Messages appear instantly on both sides
- No page refresh needed
- WebSocket connected (green dot)
- Messages persist after page refresh
- Scroll automatically to bottom

### ❌ Failure Signs:
- Chat button missing or disabled
- "Loading..." forever
- Messages don't appear
- Connection status: "Offline" (red dot)
- WebSocket error in console
- Messages require page refresh

---

## Test 4: UI Visibility - Request History (1 minute)

### Steps:
```bash
1. Login as: patient@test.com
2. Go to: Dashboard
3. Scroll to sidebar → "Request History" section
```

### ✅ Expected Appearance:
```
Request History
━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────┐
│ Dr. Smith      approved│  ← White card with border
└────────────────────────┘
┌────────────────────────┐
│ Dr. Johnson    pending │  ← Amber badge
└────────────────────────┘
```

### Check:
- ✅ Each request in separate white card
- ✅ Doctor name on left (black text, readable)
- ✅ Status badge on right (green/amber/red)
- ✅ Border around each card
- ✅ Small shadow effect
- ✅ Clear spacing between cards

### ❌ Old Appearance (should NOT look like this):
```
Dr. Smith approved       ← Plain gray background
Dr. Johnson pending      ← Status hard to see
```

---

## Test 5: Doctor Dashboard Buttons (1 minute)

### Steps:
```bash
1. Login as: doctor@test.com
2. Go to: Dashboard → "My Patients" tab
3. Locate any patient card
```

### ✅ Expected Button Layout:
```
┌─────────────────────────────────┐
│  John Doe                        │
│  Last MRI: Mild Impairment       │
│  ┌─────────────┐ ┌────────────┐ │
│  │ View Details│ │   Chat     │ │  ← Both always visible
│  └─────────────┘ └────────────┘ │
└─────────────────────────────────┘
```

### Check Both Buttons:
- ✅ "View Details": Outline style, blue hover
- ✅ "Chat": Green background, darker green hover
- ✅ Same size and alignment
- ✅ Eye icon on View Details
- ✅ MessageCircle icon on Chat
- ✅ Both visible WITHOUT hover
- ✅ Smooth hover transitions

### ❌ Failure Signs:
- View Details appears only on hover
- Buttons different sizes
- One button missing
- Opacity/fade effects

---

## 🐛 Common Issues & Fixes

### Issue 1: Chat Not Loading
**Symptoms**: "Loading..." forever, no messages
**Check**:
```bash
# Browser Console
1. Look for: [Chat] WebSocket connected
2. Check: ws.readyState === 1 (should be true)
3. Verify: Token present in localStorage
```
**Fix**: Logout and login again

### Issue 2: 403 Still Appears
**Symptoms**: Generic 403 error, no assign button
**Check**:
```bash
# Browser Console
1. Look for: [PatientDetail] Token validation failed
2. Check token: localStorage.getItem('token')
```
**Fix**: Clear localStorage, login again

### Issue 3: Notifications Missing
**Symptoms**: No notification after doctor approval
**Check**:
```bash
# Backend logs
1. Look for: [Notification] Created notification for patient
2. Verify MongoDB: db.notifications.find({})
```
**Fix**: Ensure backend running, check MongoDB connection

### Issue 4: Messages Not Real-Time
**Symptoms**: Messages appear only after refresh
**Check**:
```bash
# Browser Console (both windows)
1. Look for: [WebSocket] Connected successfully
2. Check: Connection status dot is green
3. Verify: No WebSocket close/error messages
```
**Fix**: Refresh both windows, check backend WebSocket logs

---

## 📊 Success Criteria

### All Tests Pass If:
- [x] No 403 errors when viewing patient data
- [x] Notifications appear when doctor approves
- [x] Chat buttons visible in 4 locations (patient)
- [x] Real-time messaging works both directions
- [x] Request history cards clearly visible
- [x] Doctor dashboard buttons always visible
- [x] No console errors related to these features

---

## 🔍 Console Log Reference

### Successful Chat Connection:
```
[Chat] Fetching messages between: patient@test.com and doctor@test.com
[Chat] Messages received: Array(5)
[Chat] Loaded 5 messages
[WebSocket] Connecting for user: patient@test.com
[WebSocket] Connected successfully
[WebSocket] Ready state: 1
```

### Successful 403 Fix:
```
[PatientDetail] Fetching data for patient: patient@test.com
[PatientDetail] Doctor user: doctor@test.com
[PatientDetail] Token present: true
[PatientDetail] Token verified, user: doctor@test.com
[PatientDetail] Data fetched successfully
```

### Successful Notification:
```
[Notification] Fetching notifications...
[Notification] Loaded 1 notifications
[Notification] Unread count: 1
```

---

## ⚡ Quick Regression Test (30 seconds)

Run this if you just want to verify nothing broke:

```bash
1. Login as patient
2. Dashboard should load without errors
3. Click "Chat with Doctor" (if assigned)
4. Send one message
5. Logout

6. Login as doctor
7. Dashboard should load without errors
8. Click any patient → View Details
9. Data should load (or show assign button)
10. Logout

✅ If all 10 steps work → All fixes are working
❌ If any step fails → Check relevant test section above
```

---

## 📞 Need Help?

### Check Logs In Order:
1. **Browser Console** (F12 → Console tab)
2. **Network Tab** (F12 → Network tab → Look for red/failed requests)
3. **Backend Terminal** (Check FastAPI logs)
4. **MongoDB** (Verify collections exist)

### Common Console Commands:
```javascript
// Check token
localStorage.getItem('token')

// Check WebSocket
ws.readyState // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED

// Test API manually
fetch('http://127.0.0.1:8000/users/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log)
```

---

**Test Duration**: 12 minutes total  
**Required**: 2 browser windows (or regular + incognito)  
**Prerequisites**: Backend + Frontend running, test accounts created

**Status Indicators**:
- ✅ Feature working as expected
- ⚠️ Feature partially working
- ❌ Feature broken/not working
