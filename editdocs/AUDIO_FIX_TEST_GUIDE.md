# Audio Speech Recognition Fix - Testing Guide

## Quick Test Steps

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd C:\Alzer\Modelapi
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend (with HTTPS for speech recognition)
cd C:\Alzer\frontend
npm run dev
# Then run local-ssl-proxy in Terminal 3
```

### 2. Setup HTTPS (Required for Speech Recognition)

```bash
# Terminal 3
npm install -g local-ssl-proxy
local-ssl-proxy --source 3001 --target 3000
```

Access the app at: **https://localhost:3001**

### 3. Login
- Email: `testing@gmail.com`
- Password: `test@123`

(This stores JWT token in localStorage for protected endpoints)

### 4. Navigate to Audio Test
- Go to: **https://localhost:3001/audio-cognitive-test**
- Or from dashboard: Click "Audio-Based Cognitive Test" card

### 5. Test Recording

#### Expected Flow:
1. Click **"Start Audio Test"**
2. Click **"Play Sentence"** → Listen to the sentence
3. Click **"Start Recording"**
4. **Wait 1.5 seconds** → See "Preparing microphone..."
5. See **"🎤 Listening... Speak clearly"** with pulsing mic icon
6. **Speak the sentence clearly**
7. Recording should **continue for at least 5-10 seconds**
8. Either speak to completion or click **"Stop Recording"**
9. See **"Processing your response..."**
10. View **similarity score** and comparison

### 6. What to Check in Browser Console

#### ✅ Success Indicators:
```
🎬 Starting recording with 1.5s delay...
▶️ Recognition start called
🎤 Recognition started
🗣️ Speech detected                    ← THIS IS KEY!
📝 Recognition result received
⏳ Interim transcript: the quick...
✅ Final transcript chunk: the quick brown fox
💾 Accumulated final transcript: the quick brown fox
🛑 Speech ended event fired, speech detected: true
⏱️ Speech ended, waiting 2 seconds for final results...
⏹️ Stopping recognition after speechend delay
🏁 Recognition ended
📄 Final text from ref: the quick brown fox
🔄 Comparing texts...
✅ Comparison result: { similarityScore: 95.6 }
```

#### ❌ Old Bug (Should NOT See This):
```
🎤 Recognition started
🛑 Speech ended event fired, speech detected: false
⚠️ Ignoring false speechend - no speech detected yet
[immediately stops]
```

#### ✅ New Behavior (False speechend ignored):
```
🎤 Recognition started
🛑 Speech ended event fired, speech detected: false
⚠️ Ignoring false speechend - no speech detected yet
[continues listening...]
🗣️ Speech detected                    ← Now it waits for real speech!
```

## Common Issues & Solutions

### Issue 1: "Microphone Access Denied"
**Solution:**
1. Chrome Settings → Privacy → Site Settings → Microphone
2. Find `localhost:3001` and change to "Allow"
3. Refresh the page

### Issue 2: "Speech recognition not supported"
**Solution:**
- Use **Google Chrome** or **Microsoft Edge**
- Ensure you're on **HTTPS** (https://localhost:3001)
- Firefox requires manual flag: `about:config` → `media.webspeech.recognition.enable` → true

### Issue 3: "No speech detected" repeatedly
**Solution:**
1. Check microphone in system settings
2. Test mic: `navigator.mediaDevices.getUserMedia({ audio: true })`
3. Speak louder and closer to microphone
4. Ensure quiet environment (reduce background noise)

### Issue 4: Recognition starts but no transcript appears
**Check:**
1. Internet connection (Google's API needs internet)
2. Console shows "🗣️ Speech detected" (if not, mic not picking up audio)
3. Speak clearly for 2-3 seconds minimum

### Issue 5: "401 Unauthorized" when saving results
**Solution:**
1. Ensure you're logged in
2. Check localStorage has token: `localStorage.getItem('token')`
3. Re-login if token expired

## Testing Checklist

### Basic Functionality
- [ ] Page loads without errors
- [ ] "Start Audio Test" button appears
- [ ] Microphone permission requested (first time)
- [ ] Microphone status shows "✅ Microphone Active"

### Recording Flow
- [ ] "Play Sentence" speaks the sentence aloud
- [ ] "Start Recording" shows "Preparing microphone..." for 1.5s
- [ ] Mic icon pulses with "🎤 Listening..."
- [ ] Console shows "🗣️ Speech detected" when you speak
- [ ] Recording continues for at least 5 seconds
- [ ] Transcript appears after speaking
- [ ] "Stop Recording" button works

### Results & Comparison
- [ ] Similarity score displayed (0-100%)
- [ ] Original sentence shown
- [ ] Your spoken text shown
- [ ] "Correct Recall" or "Incorrect" indicator
- [ ] "Try Again" button works
- [ ] "Next Round" advances to round 2/3

### Multi-Round Test
- [ ] Round 1 completes and saves
- [ ] Round 2 loads new sentence
- [ ] Round 3 loads new sentence
- [ ] Summary shows all 3 rounds
- [ ] Average score calculated correctly
- [ ] "Save Results & Continue" button works

### Backend Integration
- [ ] `/compare-text` returns similarity score
- [ ] `/cognitive-tests/audio-recall` saves results (with JWT)
- [ ] Results appear in "View Results History"

## Performance Benchmarks

### Timing Expectations:
- **Mic warm-up**: 1.5 seconds
- **Listening duration**: 5-10 seconds
- **Text comparison**: <1 second
- **Total per round**: ~30-45 seconds

### Success Metrics:
- **Transcript accuracy**: >90% for clear speech
- **False speechend ignored**: 100% of the time
- **No premature stops**: 0 occurrences
- **Completion rate**: 100% of valid attempts

## Debug Commands

### Check Microphone Access
```javascript
// Run in browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone access granted');
    console.log('Audio tracks:', stream.getAudioTracks());
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Microphone error:', err));
```

### Check localStorage Token
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

### Test Backend Endpoints
```bash
# Test /compare-text (public)
curl -X POST http://127.0.0.1:8000/compare-text \
  -H "Content-Type: application/json" \
  -d '{"original":"The quick brown fox","spoken":"The brown fox"}'

# Test /cognitive-tests/audio-recall (protected - needs token)
curl -X POST http://127.0.0.1:8000/cognitive-tests/audio-recall \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"test_type":"audio_recall","score":100,"total_questions":3,...}'
```

## Browser Compatibility Test Matrix

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 119+ | ✅ Full Support | Recommended |
| Edge | 119+ | ✅ Full Support | Recommended |
| Safari | 17+ | ✅ Full Support | Works on macOS/iOS |
| Firefox | 120+ | ⚠️ Limited | Requires flag |
| Brave | Latest | ⚠️ Limited | Privacy shields may block |

## Known Limitations

1. **Internet Required**: Google's Speech API needs internet connection
2. **Language**: Currently English only (can be extended)
3. **Accents**: May have lower accuracy for strong accents
4. **Background Noise**: Affects transcript accuracy
5. **Sentence Length**: Long sentences (>20 words) may be harder

## Troubleshooting Decision Tree

```
Recording stops immediately?
├─ Is "🗣️ Speech detected" shown?
│  ├─ NO → Microphone issue
│  │      ├─ Check system settings
│  │      ├─ Test with different mic
│  │      └─ Check for system mute
│  └─ YES → Check console for errors
│         ├─ "no-speech" → Too quiet / noisy
│         ├─ "aborted" → Network issue
│         └─ "not-allowed" → Permission denied
└─ Does "⚠️ Ignoring false speechend" appear?
   ├─ YES → Fix is working correctly! Keep speaking.
   └─ NO → Check if fix was applied correctly
```

## Success Criteria

### The fix is working if:
1. ✅ Recording stays active for full 10 seconds (or until manual stop)
2. ✅ Console shows "🗣️ Speech detected" when you speak
3. ✅ False speechend events are ignored (see console warning)
4. ✅ Transcript is captured successfully
5. ✅ No "Could not recognize speech" errors for valid input
6. ✅ Similarity score calculation works
7. ✅ Results save to database correctly

### Red Flags (Indicates problem):
1. ❌ Recording stops in <2 seconds without speaking
2. ❌ Never shows "🗣️ Speech detected"
3. ❌ "speechend" fires before "speechstart"
4. ❌ Transcript is always empty
5. ❌ "Could not recognize speech" on every attempt

## Next Steps After Testing

### If test passes:
1. ✅ Mark fix as verified
2. ✅ Update project documentation
3. ✅ Consider adding automated tests
4. ✅ Deploy to staging/production

### If test fails:
1. Review console logs carefully
2. Check microphone permissions
3. Verify HTTPS setup
4. Test on different browser
5. Check backend is running
6. Review error messages in detail

---

**Last Updated**: 2025-11-09  
**Fix Version**: Final  
**Testing Environment**: Windows + Chrome 119
