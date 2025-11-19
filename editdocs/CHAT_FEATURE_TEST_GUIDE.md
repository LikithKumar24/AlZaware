# Real-Time Chat Feature - Quick Test Guide

## Quick Start (3 minutes)

### Prerequisites
- Backend running on `http://127.0.0.1:8000`
- Frontend running on `http://localhost:3000`
- Doctor account with assigned patient
- Patient account with assigned doctor

### Test Flow

#### Step 1: Test Doctor → Patient Chat

1. **Login as Doctor**
   ```
   Navigate to: http://localhost:3000/login
   ```

2. **Access Chat from Dashboard**
   - Go to dashboard (home page)
   - Find "My Patients" section
   - Look for assigned patient card
   - Click green **"Chat"** button

3. **Expected Results**:
   - ✅ Redirected to `/chat?email=patient@example.com`
   - ✅ Connection status shows green dot "Connected"
   - ✅ Previous messages load (if any)
   - ✅ Input box enabled at bottom

4. **Send Test Message**
   - Type: "Hello, how are you feeling today?"
   - Click "Send" or press Enter

5. **Expected Results**:
   - ✅ Message appears on right side (blue background)
   - ✅ Timestamp shows current time
   - ✅ Input box clears
   - ✅ Delivery status: ✓ (sent) or ✓✓ (delivered)

#### Step 2: Test Patient → Doctor Chat

1. **Login as Patient**
   - Logout from doctor account
   - Login with patient credentials

2. **View Dashboard**
   - Should see green banner: "Your Doctor is Available"
   - Shows doctor's email
   - Click **"Start Chat"** button

3. **Expected Results**:
   - ✅ Redirected to chat page
   - ✅ Connection status: "Connected"
   - ✅ Previous message from doctor visible
   - ✅ Message on left side (white background)

4. **Reply to Doctor**
   - Type: "I'm doing well, thank you!"
   - Send message

#### Step 3: Test Real-Time Communication

1. **Open Two Browser Windows**
   - Window 1: Doctor chat
   - Window 2: Patient chat

2. **Send Message from Doctor Window**
   - Type and send message

3. **Expected Results**:
   - ✅ Message appears instantly in patient window
   - ✅ No page refresh needed
   - ✅ Message on left (white) in patient view
   - ✅ Message on right (blue) in doctor view

4. **Send Message from Patient Window**
   - Reply from patient

5. **Expected Results**:
   - ✅ Message appears instantly in doctor window
   - ✅ Real-time bidirectional communication works!

## API Testing

### Test WebSocket Connection
```bash
# Install wscat if needed
npm install -g wscat

# Connect as user
wscat -c ws://127.0.0.1:8000/ws/doctor@example.com

# Send message
{"receiver_email": "patient@example.com", "message": "Test message"}
```

### Test REST Endpoints

#### 1. Get Chat History
```bash
curl -X GET "http://127.0.0.1:8000/messages/doctor@example.com/patient@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
[
  {
    "_id": "abc123...",
    "sender_email": "doctor@example.com",
    "receiver_email": "patient@example.com",
    "message": "Hello, how are you feeling today?",
    "timestamp": "2024-01-15T14:30:00Z",
    "read": true
  }
]
```

#### 2. Mark Messages as Read
```bash
curl -X PATCH "http://127.0.0.1:8000/messages/mark-read/patient@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "message": "Messages marked as read",
  "modified_count": 3
}
```

## Visual Verification Checklist

### Chat Page Layout
- [ ] Header with MessageCircle icon
- [ ] "Chat with {email}" title
- [ ] Connection status (green/gray dot)
- [ ] "Back" button in header
- [ ] Messages area with gray background
- [ ] Input box and Send button at bottom

### Sender Messages (Right Side)
- [ ] Blue background (`bg-blue-600`)
- [ ] White text
- [ ] Aligned to right
- [ ] Rounded corners
- [ ] Timestamp in light blue
- [ ] Delivery status (✓ or ✓✓)

### Receiver Messages (Left Side)
- [ ] White background
- [ ] Dark text
- [ ] Border
- [ ] Aligned to left
- [ ] Rounded corners
- [ ] Timestamp in gray

### Date Dividers
- [ ] "Today" for today's messages
- [ ] "Yesterday" for yesterday
- [ ] Date format (e.g., "Jan 15") for older

### Dashboard Integration

#### Doctor Dashboard
- [ ] Green "Chat" button next to "View Details"
- [ ] MessageCircle icon
- [ ] Button enabled for assigned patients

#### Patient Dashboard
- [ ] Green banner at top (if doctor assigned)
- [ ] "Your Doctor is Available" heading
- [ ] Doctor's email shown
- [ ] "Start Chat" button with icon

## Feature Testing

### 1. Empty Chat State
**Test**: New conversation with no messages
**Expected**: 
- MessageCircle icon in center
- "No messages yet. Start the conversation!"
- Empty messages area

### 2. Long Messages
**Test**: Send message with 500+ characters
**Expected**:
- Message wraps properly
- Doesn't break layout
- Scrollable if needed

### 3. Multiple Messages
**Test**: Send 20+ messages
**Expected**:
- Auto-scrolls to bottom
- Date dividers appear correctly
- Smooth scrolling

### 4. Connection Lost
**Test**: Stop backend during active chat
**Expected**:
- Status changes to "Disconnected"
- Gray dot appears
- Red warning message
- Send button disabled
- Error in console

### 5. Reconnection
**Test**: Restart backend after disconnect
**Expected**:
- Status changes back to "Connected"
- Green dot reappears
- Can send messages again

### 6. Enter Key
**Test**: Press Enter in input box
**Expected**:
- Message sends immediately
- Same as clicking Send button

### 7. Empty Message
**Test**: Try to send empty/whitespace message
**Expected**:
- Send button disabled
- Nothing sent

### 8. Special Characters
**Test**: Send message with emojis, special chars
**Expected**:
- Renders correctly
- No encoding issues
- Example: "Hello! 👋 How are you? 😊"

## Console Verification

### Expected Console Logs:

#### Backend (WebSocket)
```
[WebSocket] User doctor@example.com connected. Active connections: 1
[WebSocket] Message from doctor@example.com to patient@example.com: Hello, how are you...
[WebSocket] Message sent to patient@example.com
[WebSocket] User patient@example.com connected. Active connections: 2
```

#### Frontend (Browser Console)
```
[WebSocket] Connected
[Chat] Loaded 5 messages
[WebSocket] Received message: {sender_email: "patient@example.com", ...}
[WebSocket] Sent message: {receiver_email: "patient@example.com", ...}
```

## Database Verification

### Check MongoDB
```javascript
// Connect to MongoDB
use alzAwareDB

// View all messages
db.messages.find().pretty()

// View conversation between two users
db.messages.find({
  $or: [
    {sender_email: "doctor@example.com", receiver_email: "patient@example.com"},
    {sender_email: "patient@example.com", receiver_email: "doctor@example.com"}
  ]
}).sort({timestamp: 1}).pretty()

// Count unread messages
db.messages.countDocuments({
  receiver_email: "doctor@example.com",
  read: false
})
```

## Performance Testing

### Test Message Speed
1. Send 10 messages rapidly
2. **Expected**: All delivered within 1-2 seconds each

### Test Multiple Connections
1. Open chat in 3 browser tabs
2. **Expected**: All tabs receive messages
3. **Check**: Backend logs show 3 connections

### Test Long Session
1. Keep chat open for 10 minutes
2. Send messages periodically
3. **Expected**: Connection stays stable
4. **No** memory leaks or performance degradation

## Edge Cases to Test

### 1. No Assigned Doctor/Patient
**Test**: Patient with no assigned doctor
**Expected**: No chat banner shown in dashboard

### 2. Invalid Email in URL
**Test**: `/chat?email=invalid`
**Expected**: Page loads but shows loading state

### 3. Concurrent Messages
**Test**: Both users send at same time
**Expected**: Both messages appear correctly

### 4. Page Refresh
**Test**: Refresh chat page during conversation
**Expected**: 
- Reconnects automatically
- History reloads
- No lost messages

### 5. Network Interruption
**Test**: Disable network briefly
**Expected**:
- Connection status updates
- Reconnects when network returns

## Common Issues & Solutions

### Issue: "Connection not open" error
**Debug Steps**:
1. Check backend WebSocket logs
2. Verify user email is correct
3. Check network connectivity
4. Look for CORS issues

### Issue: Messages not appearing
**Debug Steps**:
1. Check WebSocket connection status
2. Verify receiver email is correct
3. Check MongoDB for saved messages
4. Look at browser Network tab

### Issue: Duplicate messages
**Debug Steps**:
1. Check message ID deduplication logic
2. Verify single WebSocket connection
3. Check for multiple component mounts

### Issue: Auto-scroll not working
**Debug Steps**:
1. Check messagesEndRef is set
2. Verify scrollToBottom() is called
3. Check CSS overflow settings

## Acceptance Criteria

Feature is complete when:
- ✅ WebSocket connection establishes successfully
- ✅ Messages send and receive in real-time
- ✅ Chat history loads correctly
- ✅ Messages persist in MongoDB
- ✅ UI shows sender/receiver distinction clearly
- ✅ Connection status indicator works
- ✅ Date grouping appears correctly
- ✅ Dashboard buttons link to chat
- ✅ No console errors
- ✅ Responsive design works on mobile

## Screenshot Checklist

Take screenshots of:
1. ✅ Doctor dashboard with chat button
2. ✅ Patient dashboard with chat banner
3. ✅ Chat page with messages
4. ✅ Sender message (blue, right)
5. ✅ Receiver message (white, left)
6. ✅ Date divider
7. ✅ Connection status
8. ✅ Empty chat state

## Next Steps After Testing

If all tests pass:
1. ✅ Commit changes to Git
2. ✅ Update project documentation
3. ✅ Deploy to staging environment
4. ✅ Conduct user acceptance testing
5. ✅ Add to feature list
6. ✅ Deploy to production

If tests fail:
1. Document specific failures
2. Check relevant log files
3. Review code changes
4. Fix issues and retest
5. Update documentation

## Quick Command Reference

```bash
# Start backend
cd Modelapi
python main.py

# Start frontend
cd frontend
npm run dev

# Test WebSocket
wscat -c ws://127.0.0.1:8000/ws/test@example.com

# Check MongoDB
mongosh "mongodb+srv://..."
use alzAwareDB
db.messages.find()
```
