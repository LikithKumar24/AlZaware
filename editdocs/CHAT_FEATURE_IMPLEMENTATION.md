# Real-Time Chat Feature - Implementation Guide

## Overview
Implemented a complete real-time chat system for AlzAware that enables text-based communication between doctors and patients using WebSockets.

## Features Implemented

### 🚀 Core Features:
1. **Real-Time Communication** - WebSocket-based instant messaging
2. **Message Persistence** - All messages stored in MongoDB
3. **Chat History** - Load previous conversations
4. **Delivery Status** - See if messages were delivered
5. **Read Receipts** - Track message read status
6. **Responsive Design** - Works on all devices
7. **Auto-scroll** - Automatically scrolls to latest message
8. **Date Grouping** - Messages grouped by date
9. **Connection Status** - Visual indicator of connection state
10. **Easy Access** - Chat buttons in dashboards

## Backend Implementation (FastAPI)

### 1. MongoDB Collection
Added `messages` collection with schema:
```python
{
  "sender_email": str,
  "receiver_email": str,
  "message": str,
  "timestamp": datetime,
  "read": bool  # Default: False
}
```

### 2. WebSocket Support
- **Import**: Added `WebSocket`, `WebSocketDisconnect` to FastAPI imports
- **Connection Manager**: Created `ConnectionManager` class to handle active connections
- **Endpoint**: `/ws/{email}` - WebSocket endpoint for each user

### 3. Message Schemas
```python
class MessageCreate(BaseModel):
    receiver_email: EmailStr
    message: str

class MessagePublic(BaseModel):
    id: str = Field(alias="_id")
    sender_email: str
    receiver_email: str
    message: str
    timestamp: datetime
    read: bool = False
```

### 4. API Endpoints

#### WebSocket `/ws/{email}`
- **Purpose**: Real-time bidirectional communication
- **Auth**: Connection URL includes user's email
- **Flow**:
  1. Client connects with their email
  2. Receives messages from other users
  3. Sends messages with `{receiver_email, message}`
  4. Messages saved to MongoDB
  5. Delivered to receiver if online

#### GET `/messages/{email1}/{email2}`
- **Purpose**: Fetch chat history between two users
- **Auth**: Required (JWT token)
- **Returns**: List of messages sorted by timestamp
- **Security**: Only conversation participants can access

#### PATCH `/messages/mark-read/{partner_email}`
- **Purpose**: Mark all messages from partner as read
- **Auth**: Required (JWT token)
- **Returns**: Count of modified messages

## Frontend Implementation (React/Next.js)

### 1. Chat Page Component
**Location**: `frontend/src/pages/chat.tsx`

**Features**:
- WebSocket connection management
- Real-time message sending/receiving
- Chat history loading
- Message grouping by date
- Auto-scroll to latest message
- Delivery status indicators
- Connection status display
- Responsive UI with Tailwind CSS

**URL Format**: `/chat?email=partner@example.com`

### 2. Dashboard Integration

#### Doctor Dashboard
- **Location**: Both `DoctorDashboard.tsx` and `DoctorDashboard_new.tsx`
- **Feature**: Green "Chat" button next to "View Details" for each assigned patient
- **Icon**: MessageCircle from lucide-react

#### Patient Dashboard
- **Location**: `PatientDashboard.tsx`
- **Feature**: Prominent banner if assigned doctor exists
- **Shows**: "Your Doctor is Available" with doctor's email
- **Action**: "Start Chat" button

## Visual Design

### Chat Interface
- **Header**: Blue gradient with connection status
- **Messages Area**: Light gray background
- **Sender Messages**: Blue background, aligned right
- **Receiver Messages**: White background, aligned left
- **Date Dividers**: Rounded pills showing "Today", "Yesterday", or date
- **Input Area**: White bottom bar with text input and send button

### Message Styling
```typescript
// Sender (right side)
bg-blue-600 text-white rounded-lg shadow-sm

// Receiver (left side)
bg-white text-slate-800 border rounded-lg shadow-sm

// Timestamp
text-xs text-blue-100 (sender) / text-gray-500 (receiver)
```

### Connection Status
- **Connected**: Green dot + "Connected"
- **Disconnected**: Gray dot + "Disconnected"

### Dashboard Buttons
- **Doctor**: Green "Chat" button next to "View Details"
- **Patient**: Green banner with "Start Chat" button

## Technical Architecture

### WebSocket Flow
```
┌─────────────┐
│  Client A   │
│  connects   │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│ ConnectionManager   │
│ stores: {           │
│   email_a: ws_a,    │
│   email_b: ws_b     │
│ }                   │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  Client A sends     │
│  {receiver: B,      │
│   message: "Hi"}    │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  Save to MongoDB    │
└──────┬──────────────┘
       │
       ├──→ Send to Client B (if online)
       │
       └──→ Echo to Client A with delivery status
```

### Message Schema in MongoDB
```javascript
{
  "_id": ObjectId("..."),
  "sender_email": "doctor@example.com",
  "receiver_email": "patient@example.com",
  "message": "How are you feeling today?",
  "timestamp": ISODate("2024-01-15T14:30:00Z"),
  "read": false
}
```

### Frontend State Management
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [ws, setWs] = useState<WebSocket | null>(null);
const [isConnected, setIsConnected] = useState(false);
const [newMessage, setNewMessage] = useState('');
```

## User Flow

### Doctor → Patient Chat
1. Doctor logs in
2. Views "My Patients" in dashboard
3. Clicks green "Chat" button on patient card
4. Redirected to `/chat?email=patient@example.com`
5. WebSocket connects automatically
6. Previous messages load from database
7. Doctor types message and clicks "Send"
8. Message saved to MongoDB and sent to patient (if online)
9. Patient sees message in real-time

### Patient → Doctor Chat
1. Patient logs in
2. Sees green banner "Your Doctor is Available"
3. Clicks "Start Chat" button
4. Redirected to `/chat?email=doctor@example.com`
5. WebSocket connects automatically
6. Previous messages load
7. Patient can reply instantly

## Message Features

### Date Grouping
Messages are grouped by date with dividers:
- **Today**: Shows "Today"
- **Yesterday**: Shows "Yesterday"
- **Older**: Shows "Jan 15", "Dec 31, 2023", etc.

### Timestamps
Each message shows time in 12-hour format:
- "2:30 PM"
- "11:45 AM"

### Delivery Status
Sender messages show:
- ✓ - Sent
- ✓✓ - Delivered (receiver was online)

### Read Receipts
Messages automatically marked as read when:
- Receiver opens the chat
- PATCH `/messages/mark-read/{partner_email}` called

## Code Examples

### Backend - WebSocket Endpoint
```python
@app.websocket("/ws/{email}")
async def websocket_endpoint(websocket: WebSocket, email: str):
    await manager.connect(email, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Save to database
            message_doc = {
                "sender_email": email,
                "receiver_email": data["receiver_email"],
                "message": data["message"],
                "timestamp": datetime.now(timezone.utc),
                "read": False
            }
            
            result = await messages_collection.insert_one(message_doc)
            
            # Send to receiver if online
            await manager.send_personal_message(message_doc, data["receiver_email"])
    
    except WebSocketDisconnect:
        manager.disconnect(email)
```

### Frontend - Send Message
```typescript
const sendMessage = async () => {
  if (!newMessage.trim() || !ws) return;
  
  const messageData = {
    receiver_email: partnerEmail,
    message: newMessage.trim(),
  };
  
  ws.send(JSON.stringify(messageData));
  setNewMessage('');
};
```

### Frontend - Receive Message
```typescript
websocket.onmessage = (event) => {
  const message: Message = JSON.parse(event.data);
  
  setMessages((prev) => {
    if (prev.some((m) => m._id === message._id)) {
      return prev;  // Avoid duplicates
    }
    return [...prev, message];
  });
};
```

## Testing Guide

### Test Scenario 1: Doctor Initiates Chat
1. Login as doctor
2. Go to dashboard
3. Find assigned patient in "My Patients"
4. Click green "Chat" button
5. **Expected**: Chat page opens, history loads, connection established

### Test Scenario 2: Send Message
1. Type "Hello, how are you?" in input
2. Click "Send" or press Enter
3. **Expected**: 
   - Message appears on right (blue)
   - Input cleared
   - Timestamp shows current time
   - Delivery status shows ✓ or ✓✓

### Test Scenario 3: Receive Message
1. Open chat as patient in one browser
2. Open same chat as doctor in another browser
3. Doctor sends message
4. **Expected**: Patient sees message instantly on left (white)

### Test Scenario 4: Connection Status
1. Stop backend server
2. **Expected**: 
   - Status changes to "Disconnected"
   - Red warning appears
   - Send button disabled

### Test Scenario 5: Chat History
1. Send several messages
2. Close and reopen chat page
3. **Expected**: All previous messages load in correct order

### Test Scenario 6: Date Grouping
1. Send messages today
2. Modify MongoDB to add old messages
3. **Expected**: 
   - "Today" divider for today's messages
   - "Yesterday" or date divider for old messages

## Security Considerations

1. **WebSocket Auth**: Email in URL (consider JWT token in future)
2. **API Auth**: All REST endpoints require JWT token
3. **Access Control**: Users can only view their own conversations
4. **XSS Prevention**: React automatically escapes message content
5. **Input Validation**: Empty messages rejected

## Performance Optimization

### Current Implementation:
- **WebSocket**: Single persistent connection per user
- **Message Load**: All messages fetched on open (consider pagination)
- **Auto-scroll**: Smooth scroll to latest message
- **State Management**: React hooks for efficient updates

### Potential Improvements:
1. **Pagination**: Load messages in chunks for long conversations
2. **Virtual Scrolling**: For very long message lists
3. **Message Caching**: Cache recent conversations in localStorage
4. **Typing Indicators**: Show when partner is typing
5. **Online Status**: Show when partner is online/offline

## Database Indexes

### Recommended Indexes:
```javascript
// For faster message queries
db.messages.createIndex({ 
  "sender_email": 1, 
  "receiver_email": 1, 
  "timestamp": -1 
});

db.messages.createIndex({ 
  "receiver_email": 1, 
  "read": 1 
});
```

## Troubleshooting

### Issue: Messages not sending
**Solution**: 
- Check WebSocket connection status
- Verify backend is running
- Check browser console for errors
- Ensure input is not empty

### Issue: Connection keeps dropping
**Solution**:
- Check network stability
- Verify backend WebSocket configuration
- Check for firewall/proxy issues

### Issue: Messages not appearing
**Solution**:
- Check partner's email is correct
- Verify MongoDB connection
- Check console logs for errors

### Issue: Duplicate messages
**Solution**:
- Check message ID deduplication logic
- Verify WebSocket isn't reconnecting repeatedly

## Files Modified/Created

### Backend (`Modelapi/main.py`):
- ✅ Added WebSocket imports
- ✅ Added `messages_collection`
- ✅ Added `MessageCreate` and `MessagePublic` schemas
- ✅ Created `ConnectionManager` class
- ✅ Added `/ws/{email}` WebSocket endpoint
- ✅ Added `GET /messages/{email1}/{email2}` endpoint
- ✅ Added `PATCH /messages/mark-read/{partner_email}` endpoint

### Frontend:
- ✅ Created `frontend/src/pages/chat.tsx` (complete chat interface)
- ✅ Modified `frontend/src/components/dashboard/DoctorDashboard.tsx` (added chat button)
- ✅ Modified `frontend/src/components/dashboard/DoctorDashboard_new.tsx` (added chat button)
- ✅ Modified `frontend/src/components/dashboard/PatientDashboard.tsx` (added chat banner)

## Future Enhancements

### Potential Features:
1. **Typing Indicators**: Show "User is typing..."
2. **Online Status**: Display user's online/offline status
3. **File Sharing**: Send images, documents
4. **Voice Messages**: Record and send audio
5. **Message Reactions**: Like, heart, thumbs up
6. **Message Editing**: Edit sent messages
7. **Message Deletion**: Delete messages
8. **Search**: Search within conversation
9. **Notifications**: Browser push notifications for new messages
10. **Group Chat**: Multiple participants
11. **Video Call**: Integrate video calling
12. **Message Threading**: Reply to specific messages

## Configuration

### Backend:
- **WebSocket URL**: `ws://127.0.0.1:8000/ws/{email}`
- **Message Collection**: `messages`
- **Default Read Status**: `False`

### Frontend:
- **Chat Page**: `/chat?email={partner_email}`
- **Auto-scroll**: Enabled by default
- **Message Alignment**: Right (sender), Left (receiver)

## Summary

The real-time chat feature is now fully implemented with:
- ✅ WebSocket-based real-time communication
- ✅ Message persistence in MongoDB
- ✅ Chat history loading
- ✅ Delivery and read status tracking
- ✅ Responsive, modern UI
- ✅ Easy access from dashboards
- ✅ Date grouping and timestamps
- ✅ Connection status indicators
- ✅ Auto-scroll functionality

Doctors and patients can now communicate instantly through a professional, easy-to-use chat interface! 💬
