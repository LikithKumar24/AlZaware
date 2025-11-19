# In-App Notification Feature - Implementation Guide

## Overview
Added a basic in-app notification system to AlzAware that notifies patients when doctors accept their supervision requests.

## Features Implemented

### 🔔 Core Features:
1. **Automatic Notification Creation** - Notifications created when doctor accepts patient request
2. **Real-time Display** - Notifications shown in patient dashboard
3. **Unread Badge** - Visual indicator for new notifications
4. **Mark as Read** - Ability to mark all notifications as read
5. **Auto-refresh** - Polls for new notifications every 30 seconds
6. **Toast Alerts** - In-app toast when new notifications arrive

## Backend Implementation (FastAPI)

### 1. MongoDB Collection
Added new `notifications` collection with schema:
```python
{
  "user_email": str,
  "message": str,
  "type": "doctor_acceptance",
  "status": "unread",  # or "read"
  "timestamp": datetime
}
```

### 2. Notification Schemas
```python
class NotificationCreate(BaseModel):
    user_email: EmailStr
    message: str
    type: str
    status: str = "unread"
    timestamp: datetime

class NotificationPublic(BaseModel):
    id: str = Field(alias="_id")
    user_email: str
    message: str
    type: str
    status: str
    timestamp: datetime
```

### 3. API Endpoints

#### GET `/notifications/`
- **Purpose**: Fetch all notifications for current user
- **Auth**: Required (JWT token)
- **Returns**: List of notifications sorted by timestamp (newest first)
- **Response**:
```json
[
  {
    "_id": "notification_id",
    "user_email": "patient@example.com",
    "message": "Dr. John Smith has accepted your supervision request.",
    "type": "doctor_acceptance",
    "status": "unread",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

#### PATCH `/notifications/mark-read`
- **Purpose**: Mark all unread notifications as read for current user
- **Auth**: Required (JWT token)
- **Returns**: Success message with count of modified notifications
- **Response**:
```json
{
  "message": "Notifications marked as read",
  "modified_count": 3
}
```

### 4. Modified `/doctor/respond-request` Endpoint
When a doctor approves a patient request, the system now:
1. Updates patient assignment relationships
2. **Creates a notification** for the patient
3. Returns updated doctor info

```python
# Create notification for the patient
notification_doc = {
    "user_email": patient["email"],
    "message": f"Dr. {current_user.get('full_name', 'Unknown')} has accepted your supervision request.",
    "type": "doctor_acceptance",
    "status": "unread",
    "timestamp": datetime.now(timezone.utc)
}
await notification_collection.insert_one(notification_doc)
```

## Frontend Implementation (React/Next.js)

### 1. Notifications Component
**Location**: `frontend/src/components/patient/Notifications.tsx`

**Features**:
- Fetches notifications on mount
- Auto-refreshes every 30 seconds
- Displays unread count badge
- Shows custom toast for new notifications
- Mark all as read functionality
- Responsive design with Tailwind CSS

**Props**:
```typescript
interface NotificationsProps {
  maxDisplay?: number;        // Default: 3
  showMarkAllRead?: boolean;  // Default: true
}
```

**Usage**:
```tsx
import Notifications from '@/components/patient/Notifications';

<Notifications maxDisplay={3} showMarkAllRead={true} />
```

### 2. Updated Patient Dashboard
**Location**: `frontend/src/components/dashboard/PatientDashboard.tsx`

Added notifications section above the action buttons:
```tsx
{/* Notifications Section */}
<div className="mt-8 w-full max-w-2xl">
  <Notifications maxDisplay={3} showMarkAllRead={true} />
</div>
```

## Visual Design

### Unread Notifications
- **Background**: Light blue (`bg-blue-50`)
- **Text**: Dark blue (`text-blue-900`)
- **Border**: Blue (`border-blue-200`)
- **Indicator**: Pulsing blue dot
- **Badge**: Blue with white text showing count

### Read Notifications
- **Background**: Light gray (`bg-gray-50`)
- **Text**: Gray (`text-gray-600`)
- **Border**: Gray (`border-gray-200`)
- **No indicator dot**

### Toast Notification
- **Position**: Fixed top-right
- **Style**: Blue background with white text
- **Duration**: 5 seconds for new notifications, 3 seconds for actions
- **Animation**: Slide in from top

## User Flow

### Patient Side:
1. Patient sends supervision request to doctor (existing feature)
2. Doctor receives request in their dashboard
3. Doctor approves the request
4. **NEW**: System creates notification for patient
5. Patient sees notification on their dashboard
6. Patient gets toast alert about new notification
7. Patient can click "Mark all read" to clear unread status

### Doctor Side:
- No changes to doctor workflow
- Notification creation is automatic and transparent

## Testing Guide

### Test Scenario 1: Create Notification
1. Login as a patient
2. Request a doctor for supervision
3. Login as that doctor
4. Go to "Patient Requests" tab
5. Click "Approve" for the patient's request
6. Login back as the patient
7. **Expected**: See notification "Dr. [Name] has accepted your supervision request."

### Test Scenario 2: Unread Badge
1. Login as patient with unread notifications
2. **Expected**: Blue badge showing unread count next to "Notifications" title
3. **Expected**: Unread notifications have blue background and pulsing dot

### Test Scenario 3: Mark as Read
1. Have unread notifications
2. Click "Mark all read" button
3. **Expected**: All notifications turn gray
4. **Expected**: Unread badge disappears
5. **Expected**: Toast shows "All notifications marked as read"

### Test Scenario 4: Auto-refresh
1. Login as patient in one browser
2. Login as doctor in another browser
3. Doctor approves patient request
4. Wait up to 30 seconds on patient dashboard
5. **Expected**: New notification appears automatically

### Test Scenario 5: Toast Alert
1. Login as patient
2. Have new unread notifications
3. Refresh the page
4. **Expected**: Toast appears in top-right corner
5. **Expected**: Toast shows count of unread notifications
6. **Expected**: Toast disappears after 5 seconds

## Technical Details

### Auto-Refresh Mechanism
```typescript
useEffect(() => {
  fetchNotifications();
  
  // Poll for new notifications every 30 seconds
  const interval = setInterval(fetchNotifications, 30000);
  
  return () => clearInterval(interval);
}, [token]);
```

### Toast Logic
- Shows toast only when unread count increases
- Prevents duplicate toasts on mount
- Auto-dismisses after timeout

### Error Handling
- Backend: Try-catch blocks with HTTP exceptions
- Frontend: Console error logging
- Graceful degradation if notifications fail to load

## Files Modified/Created

### Backend (`Modelapi/main.py`):
- ✅ Added `notification_collection` to MongoDB collections
- ✅ Added `NotificationCreate` and `NotificationPublic` schemas
- ✅ Modified `/doctor/respond-request` to create notifications
- ✅ Added `GET /notifications/` endpoint
- ✅ Added `PATCH /notifications/mark-read` endpoint

### Frontend:
- ✅ Created `frontend/src/components/patient/Notifications.tsx`
- ✅ Modified `frontend/src/components/dashboard/PatientDashboard.tsx`

## Configuration

### Backend:
- **Polling Interval**: 30 seconds (configurable in frontend)
- **Notification Type**: `"doctor_acceptance"` (extensible for future types)
- **Default Status**: `"unread"`

### Frontend:
- **Max Display**: 3 notifications (configurable via props)
- **Auto-refresh**: 30 seconds
- **Toast Duration**: 5 seconds (new notifications), 3 seconds (actions)

## Future Enhancements

### Potential Features:
1. **Multiple Notification Types**:
   - Test results ready
   - Appointment reminders
   - Doctor messages
   - System announcements

2. **Real-time Updates**:
   - WebSocket integration for instant notifications
   - No need for polling

3. **Notification Center Page**:
   - View all notifications with pagination
   - Filter by type, date, status
   - Delete individual notifications

4. **Push Notifications**:
   - Browser push notifications
   - Email notifications

5. **Notification Preferences**:
   - User settings to enable/disable notification types
   - Notification frequency settings

6. **Doctor Notifications**:
   - Notify doctors when patients submit new assessments
   - High-risk patient alerts

7. **Action Buttons**:
   - Quick actions from notification (e.g., "View Results")
   - Dismiss individual notifications

## Database Indexes

### Recommended Indexes:
```javascript
// For faster queries
db.notifications.createIndex({ "user_email": 1, "timestamp": -1 })
db.notifications.createIndex({ "user_email": 1, "status": 1 })
```

## Security Considerations

1. **Authorization**: Users can only see their own notifications
2. **Token Validation**: All endpoints require valid JWT token
3. **XSS Prevention**: React automatically escapes rendered content
4. **Rate Limiting**: Consider adding rate limits to prevent API abuse

## Performance

### Current Implementation:
- **Query**: Efficient with proper indexes
- **Polling**: 30-second interval minimizes server load
- **Frontend**: React state management for efficient re-renders
- **Payload**: Lightweight notification objects

### Optimization Tips:
- Add pagination for users with many notifications
- Implement cursor-based pagination for better performance
- Consider caching notification count

## Troubleshooting

### Issue: Notifications not appearing
**Solution**: 
- Check backend is running
- Verify JWT token is valid
- Check browser console for errors
- Verify notification was created in MongoDB

### Issue: Toast not showing
**Solution**:
- Check if new notifications exist
- Verify toast state logic
- Check CSS for toast visibility

### Issue: Auto-refresh not working
**Solution**:
- Check useEffect dependencies
- Verify interval is set correctly
- Check if component is unmounted

## API Examples

### Create Notification (Internal)
```python
notification_doc = {
    "user_email": "patient@example.com",
    "message": "Dr. John Smith has accepted your supervision request.",
    "type": "doctor_acceptance",
    "status": "unread",
    "timestamp": datetime.now(timezone.utc)
}
await notification_collection.insert_one(notification_doc)
```

### Fetch Notifications (Frontend)
```typescript
const response = await axios.get('http://127.0.0.1:8000/notifications/', {
  headers: { Authorization: `Bearer ${token}` },
});
const notifications = response.data;
```

### Mark as Read (Frontend)
```typescript
await axios.patch(
  'http://127.0.0.1:8000/notifications/mark-read',
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);
```

## Summary

The notification feature is now fully implemented with:
- ✅ Backend API endpoints
- ✅ Frontend React component
- ✅ Auto-refresh mechanism
- ✅ Toast alerts
- ✅ Mark as read functionality
- ✅ Visual indicators for unread notifications
- ✅ Responsive design

Patients will now receive clear, timely notifications when doctors accept their supervision requests, improving communication and user experience.
