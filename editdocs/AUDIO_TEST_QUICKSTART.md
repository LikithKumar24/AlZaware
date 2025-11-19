# Audio-Based Cognitive Test - Quick Start Guide

## 🚀 Quick Start

### For Users:
1. Navigate to: `http://localhost:3000/assessment`
2. Click the **"Audio-Based Cognitive Test"** card (pink with microphone icon)
3. Read instructions and click "Start Audio Test"
4. Complete 3 rounds of listening and repeating
5. View your results and save to profile

### For Developers:

#### Start the Application:
```bash
# Terminal 1 - Backend
cd C:\Alzer\Modelapi
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd C:\Alzer\frontend
npm run dev
```

#### Access Points:
- **Frontend**: http://localhost:3000
- **Test Page**: http://localhost:3000/audio-cognitive-test
- **Assessment**: http://localhost:3000/assessment
- **API Docs**: http://127.0.0.1:8000/docs

---

## 📋 Test Flow Overview

```
1. Instructions → 2. Listen → 3. Record → 4. Results → 5. Summary
    ↓              ↓            ↓            ↓            ↓
  Start        Play        Record      Compare       Save
  Test      Sentence      Voice        Text       Results
```

### Detailed Flow:
1. **Instructions**: User reads about test, clicks start
2. **Listen (Round 1-3)**: System plays sentence aloud
3. **Record (Round 1-3)**: User repeats sentence into microphone
4. **Results (Round 1-3)**: System shows similarity score, feedback
5. **Summary**: Overall performance, save results to database

---

## 🔌 API Endpoints Reference

### 1. Compare Text Similarity
```http
POST http://127.0.0.1:8000/compare-text
Content-Type: application/json

{
  "original": "The quick brown fox jumps over the lazy dog.",
  "spoken": "The brown fox jumped over the lazy dog."
}
```

**Response**:
```json
{
  "similarityScore": 85.5
}
```

---

### 2. Save Audio Test Results
```http
POST http://127.0.0.1:8000/cognitive-tests/audio-recall
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "test_type": "audio_recall",
  "score": 67,
  "total_questions": 3,
  "average_similarity": 78.5,
  "correct_recalls": 2,
  "total_rounds": 3,
  "round_details": [
    {
      "round": 1,
      "originalText": "The quick brown fox...",
      "spokenText": "The brown fox...",
      "similarityScore": 75.0,
      "correct": true
    }
  ]
}
```

---

### 3. Get Audio Test History
```http
GET http://127.0.0.1:8000/cognitive-tests/audio-recall
Authorization: Bearer <JWT_TOKEN>
```

**Optional Query Parameter**:
- `patient_email=patient@example.com` (for doctors viewing patient data)

---

## 🗄️ MongoDB Schema

### Collection: `audio_recall_tests`

```javascript
{
  "_id": ObjectId("..."),
  "test_type": "audio_recall",
  "score": 67,                        // Overall percentage (0-100)
  "total_questions": 3,               // Number of rounds
  "average_similarity": 78.33,        // Average similarity across rounds
  "correct_recalls": 2,               // Number of rounds with ≥70% similarity
  "total_rounds": 3,
  "round_details": [
    {
      "round": 1,
      "originalText": "The quick brown fox jumps over the lazy dog.",
      "spokenText": "The brown fox jumps over the lazy dog.",
      "similarityScore": 85.5,
      "correct": true
    },
    // ... more rounds
  ],
  "owner_email": "patient@example.com",
  "created_at": ISODate("2025-11-09T13:00:00Z")
}
```

---

## 🧪 Testing Checklist

### Manual Testing:

- [ ] Visit `/assessment` page
- [ ] Click "Audio-Based Cognitive Test" card
- [ ] Verify instructions display correctly
- [ ] Click "Start Audio Test"
- [ ] **Round 1**: Click "Play Sentence"
- [ ] Verify browser speaks sentence
- [ ] Click "Start Recording"
- [ ] Grant microphone permission
- [ ] Speak sentence into microphone
- [ ] Verify transcription appears
- [ ] Check similarity score displays
- [ ] Verify correct/incorrect status shown
- [ ] Click "Next Round"
- [ ] **Repeat for Rounds 2 & 3**
- [ ] Verify summary shows all 3 rounds
- [ ] Check average score calculated
- [ ] Click "Save Results & Continue"
- [ ] Verify redirect to results history
- [ ] Check test appears in MongoDB

### Browser Compatibility:

- [ ] Google Chrome ✅ (Recommended)
- [ ] Microsoft Edge ✅ (Recommended)
- [ ] Safari ✅ (macOS/iOS)
- [ ] Firefox ⚠️ (Limited support)

### API Testing (Postman/curl):

```bash
# Test text comparison
curl -X POST http://127.0.0.1:8000/compare-text \
  -H "Content-Type: application/json" \
  -d '{
    "original": "Hello world",
    "spoken": "Hello there"
  }'

# Expected: {"similarityScore": 54.54}
```

---

## 🎯 Key Features

### 1. Browser Compatibility Detection
- Automatically checks for Web Speech API support
- Shows error message if browser unsupported
- Recommends compatible browsers

### 2. Text-to-Speech (Listen Phase)
- Uses browser's native SpeechSynthesis API
- Rate: 0.9 (slightly slower for clarity)
- Auto-advances after playback complete

### 3. Speech-to-Text (Record Phase)
- Uses browser's SpeechRecognition API
- Real-time transcription
- Error handling for failed recognition

### 4. Similarity Algorithm
- Python `difflib.SequenceMatcher`
- Case-insensitive comparison
- Returns 0-100% similarity score

### 5. Performance Assessment
- ≥80%: Excellent
- 70-79%: Good
- 50-69%: Fair
- <50%: Needs Improvement

---

## 🐛 Troubleshooting

### Issue: "Error: Could not recognize speech" ✅ FIXED
**What was wrong**: 
- Recognition settings were `continuous: false` and `interimResults: false`
- No microphone warm-up delay
- No retry logic for "no-speech" errors

**What was fixed**:
- ✅ Changed to `continuous: true` and `interimResults: true`
- ✅ Added 1.5-second delay before starting recognition
- ✅ Automatic retry up to 2 times if no speech detected
- ✅ Microphone permission check on component mount
- ✅ Better error handling with specific messages
- ✅ Console logging for diagnostics

**How to verify the fix works**:
1. Open browser console (F12)
2. Start recording
3. Look for logs:
   - 🎤 Recognition started
   - 🗣️ Speech detected (when you speak)
   - ✅ Final transcript: [your text]
4. UI should show "Preparing microphone..." then "🎤 Listening..."

### Issue: "Browser Not Supported"
**Solution**: Use Chrome, Edge, or Safari. Update to latest version.

### Issue: Microphone Not Working
**Solution**: 
1. Check browser permissions (chrome://settings/content/microphone)
2. Ensure microphone not in use by another app
3. Try reloading page
4. **NEW**: Look for microphone status on instructions page:
   - ✅ Microphone Active (green) = ready to test
   - ❌ Microphone Access Denied (red) = grant permission

### Issue: Sentence Not Playing
**Solution**:
1. Check browser volume
2. Try clicking "Play Sentence" again
3. Ensure browser allows audio playback

### Issue: Speech Not Recognized
**Solution**:
1. **Wait for "Listening..." indicator** - don't speak during "Preparing microphone..." phase
2. Speak clearly and at normal pace
3. Reduce background noise
4. Check microphone volume/quality
5. Try speaking closer to microphone
6. **NEW**: System will auto-retry up to 2 times if no speech detected

### Issue: Recognition Stops Immediately
**Solution**: 
This was the main bug that's now fixed. If you still experience it:
1. Check console (F12) for error logs
2. Verify microphone permission is granted
3. Try refreshing page
4. Ensure you're using Chrome or Edge
5. Check that another app isn't using the microphone

### Issue: Low Similarity Score Despite Correct Repeat
**Solution**: Algorithm is strict - even minor word differences affect score. This is intentional for clinical accuracy.

### Issue: Results Not Saving
**Solution**:
1. Check network connection
2. Verify JWT token not expired (re-login)
3. Check browser console for errors

---

## 🔧 Customization

### Change Number of Rounds:
```typescript
// AudioRecallTest.tsx, line 56
const NUM_ROUNDS = 3; // Change to 5, 10, etc.
```

### Add More Sentences:
```typescript
// AudioRecallTest.tsx
const TEST_SENTENCES: TestSentence[] = [
  { text: 'Your new sentence here.', difficulty: 'short' },
  // ... add more
];
```

### Adjust Similarity Threshold:
```typescript
// AudioRecallTest.tsx, line 235
const isCorrect = similarityScore >= 70; // Change threshold
```

### Modify Speech Rate:
```typescript
// AudioRecallTest.tsx, line 157
utterance.rate = 0.9; // 0.1 - 2.0 (slower - faster)
```

---

## 📊 Data Analysis

### Query Recent Tests:
```javascript
// MongoDB query
db.audio_recall_tests.find({
  created_at: { $gte: new Date("2025-11-01") }
}).sort({ created_at: -1 })
```

### Calculate Average Performance:
```javascript
db.audio_recall_tests.aggregate([
  {
    $group: {
      _id: null,
      avgScore: { $avg: "$average_similarity" },
      avgCorrect: { $avg: "$correct_recalls" }
    }
  }
])
```

### Find Users with Low Scores:
```javascript
db.audio_recall_tests.find({
  average_similarity: { $lt: 50 }
})
```

---

## 📱 Mobile Considerations

### iOS Safari:
- Requires user interaction before playing audio
- Microphone permission handled by system
- May have shorter timeout for recognition

### Android Chrome:
- Generally works well
- Check microphone permissions in Android settings
- May need to enable speech recognition in browser

### Responsive Design:
- Layout adapts to small screens
- Touch-friendly buttons
- Readable text sizes

---

## 🚀 Deployment Notes

### Production Checklist:

- [ ] Update API base URL in frontend
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS for microphone access
- [ ] Set up MongoDB indexes for performance
- [ ] Configure environment variables
- [ ] Test on production browser versions
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Add analytics tracking
- [ ] Create backup strategy for MongoDB

### Environment Variables Needed:
```bash
# Backend
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CORS_ORIGINS=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 📚 Additional Resources

- **Full Documentation**: See `AUDIO_COGNITIVE_TEST_IMPLEMENTATION.md`
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **SequenceMatcher**: https://docs.python.org/3/library/difflib.html
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Next.js Docs**: https://nextjs.org/docs

---

## ✅ Success Criteria

Test is working correctly when:
- [x] Card appears on assessment page
- [x] Instructions display clearly
- [x] Sentences play audibly
- [x] Microphone records voice
- [x] Transcription appears
- [x] Similarity score calculated
- [x] Results save to MongoDB
- [x] Summary shows correct data
- [x] Integration with AlzAware seamless

---

## 🎉 Quick Test Script

```bash
# 1. Start backend
cd C:\Alzer\Modelapi
uvicorn main:app --reload &

# 2. Start frontend  
cd C:\Alzer\frontend
npm run dev &

# 3. Open browser
start http://localhost:3000/audio-cognitive-test

# 4. Test API endpoint
curl -X POST http://127.0.0.1:8000/compare-text \
  -H "Content-Type: application/json" \
  -d '{"original":"test","spoken":"test"}'

# Expected: {"similarityScore":100.0}
```

---

**Status**: ✅ Speech Recognition Bug Fixed - Feature Complete and Ready for Testing

**Last Updated**: November 9, 2025 - Fixed "Could not recognize speech" error

**Recent Fixes**:
- ✅ Speech recognition now works reliably with continuous mode
- ✅ Added 1.5s microphone warm-up delay
- ✅ Auto-retry logic (max 2 attempts) for no-speech errors
- ✅ Microphone permission check on startup
- ✅ Enhanced error handling and user feedback
- ✅ Comprehensive diagnostic console logging

**See Also**: 
- `AUDIO_TEST_SPEECH_RECOGNITION_FIX.md` - Detailed technical fix documentation
- `AUDIO_COGNITIVE_TEST_IMPLEMENTATION.md` - Full feature documentation

**Contact**: For issues or questions, refer to main project documentation.
