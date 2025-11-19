# Notification Feature - Quick Test Guide

## Quick Start (5 minutes)

### Prerequisites
- Backend running on `http://127.0.0.1:8000`
- Frontend running on `http://localhost:3000`
- Two test accounts: one patient, one doctor

### Test Flow

#### Step 1: Create Test Notification
1. **Login as Patient**
   - Go to `http://localhost:3000/login`
   - Login with patient credentials

2. **Request Doctor Supervision**
   - Click "View Doctors"
   - Click "Request as Supervisor" on any doctor
   - Note: May already have pending request

3. **Login as Doctor**
   - Logout and login with doctor account
   - Go to dashboard
   - Click "Patient Requests" tab

4. **Approve Patient Request**
   - Find the patient's request
   - Click "Approve" ✅
   - **Backend creates notification automatically**

#### Step 2: View Notification
1. **Login Back as Patient**
   - Logout and login with patient account
   - Go to dashboard (home page)

2. **Expected Results**:
   - ✅ See "Notifications" section with bell icon
   - ✅ Blue badge showing "1" next to "Notifications"
   - ✅ Blue notification box with message: "Dr. [Name] has accepted your supervision request."
   - ✅ Pulsing blue dot on unread notification
   - ✅ Toast appears in top-right: "You have 1 new notification from your doctor!"

#### Step 3: Test Mark as Read
1. **Click "Mark all read" button**
   
2. **Expected Results**:
   - ✅ Notification turns gray
   - ✅ Blue badge disappears
   - ✅ Pulsing dot disappears
   - ✅ Toast shows "All notifications marked as read"

## API Testing

### Test Endpoints with cURL

#### 1. Get Notifications
```bash
curl -X GET "http://127.0.0.1:8000/notifications/" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
[
  {
    "_id": "677abc123...",
    "user_email": "patient@example.com",
    "message": "Dr. John Smith has accepted your supervision request.",
    "type": "doctor_acceptance",
    "status": "unread",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

#### 2. Mark as Read
```bash
curl -X PATCH "http://127.0.0.1:8000/notifications/mark-read" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "message": "Notifications marked as read",
  "modified_count": 1
}
```

## Visual Verification Checklist

### Unread Notification Should Have:
- [ ] Light blue background (`bg-blue-50`)
- [ ] Dark blue text (`text-blue-900`)
- [ ] Blue border
- [ ] Pulsing blue dot on left
- [ ] Bold/medium font weight
- [ ] Timestamp in gray below message

### Read Notification Should Have:
- [ ] Light gray background (`bg-gray-50`)
- [ ] Gray text (`text-gray-600`)
- [ ] Gray border
- [ ] No pulsing dot
- [ ] Normal font weight
- [ ] Timestamp in gray below message

### Notification Header Should Show:
- [ ] Bell icon
- [ ] "Notifications" title
- [ ] Blue badge with unread count (if unread exist)
- [ ] "Mark all read" button (if unread exist)

### Toast Should:
- [ ] Appear in top-right corner
- [ ] Have blue background
- [ ] Show bell icon
- [ ] Display message count
- [ ] Disappear after 5 seconds

## Edge Cases to Test

### 1. No Notifications
**Test**: New patient account with no notifications
**Expected**: "No notifications yet" message in gray box

### 2. Multiple Notifications
**Test**: Create 5+ notifications
**Expected**: 
- Show first 3 by default
- "+2 more notifications" message at bottom

### 3. Auto-Refresh
**Test**: Keep dashboard open, approve request in another window
**Expected**: New notification appears within 30 seconds

### 4. Invalid Token
**Test**: Clear localStorage token, try to fetch notifications
**Expected**: No error, just no notifications loaded

### 5. Backend Down
**Test**: Stop backend, reload patient dashboard
**Expected**: "Loading..." state, no crash

## Console Verification

### Expected Console Logs:

#### When Fetching Notifications:
```
[Notifications] Fetched 1 notifications
```

#### When Marking as Read:
```
[Notifications] Marked all as read
```

#### Backend (When Creating Notification):
```
[Notification] Created notification for patient patient@example.com
```

## Database Verification

### Check MongoDB
```javascript
// Connect to MongoDB
use alzAwareDB

// View all notifications
db.notifications.find().pretty()

// View notifications for specific user
db.notifications.find({ user_email: "patient@example.com" }).pretty()

// Count unread notifications
db.notifications.countDocuments({ status: "unread" })
```

## Common Issues & Solutions

### Issue: "No notifications yet" shown but should have notifications
**Debug Steps**:
1. Check MongoDB: `db.notifications.find({ user_email: "YOUR_EMAIL" })`
2. Check backend logs for errors
3. Verify token in localStorage
4. Check Network tab for API calls

### Issue: Toast not appearing
**Debug Steps**:
1. Open browser console
2. Look for `[Notifications] Fetched` log
3. Check if unreadCount > 0
4. Verify toast logic in component

### Issue: "Mark all read" doesn't work
**Debug Steps**:
1. Check Network tab for PATCH request
2. Verify backend response
3. Check MongoDB if status changed
4. Look for console errors

### Issue: Auto-refresh not working
**Debug Steps**:
1. Check if interval is set (console log)
2. Verify component doesn't unmount
3. Check Network tab for periodic requests every 30s

## Performance Testing

### Test Auto-Refresh Load
1. Open patient dashboard
2. Open Network tab
3. Wait 2 minutes
4. **Expected**: See 4 requests to `/notifications/` (every 30 seconds)

### Test Multiple Tabs
1. Open patient dashboard in 2 tabs
2. Approve request in doctor account
3. **Expected**: Both tabs show notification within 30 seconds

## Acceptance Criteria

Feature is complete when:
- ✅ Notifications created automatically when doctor approves
- ✅ Patients see notifications in dashboard
- ✅ Unread badge shows correct count
- ✅ Mark all read works correctly
- ✅ Toast appears for new notifications
- ✅ Auto-refresh works every 30 seconds
- ✅ Visual design matches specifications
- ✅ No console errors
- ✅ API endpoints respond correctly
- ✅ MongoDB stores notifications properly

## Screenshot Checklist

Take screenshots of:
1. ✅ Unread notification with badge
2. ✅ Read notification (gray)
3. ✅ Toast notification
4. ✅ Empty notifications state
5. ✅ Multiple notifications
6. ✅ Mark all read button

## Next Steps After Testing

If all tests pass:
1. ✅ Commit changes to Git
2. ✅ Update project documentation
3. ✅ Deploy to staging environment
4. ✅ Conduct user acceptance testing
5. ✅ Deploy to production

If tests fail:
1. Document specific failures
2. Check relevant log files
3. Review code changes
4. Fix issues and retest
5. Update documentation if needed
