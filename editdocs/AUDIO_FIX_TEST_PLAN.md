# Audio Speech Recognition Fix - Testing Plan

## Quick Test (5 minutes)

### Prerequisites
```bash
# Terminal 1: Start backend
cd C:\Alzer\Modelapi
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend
cd C:\Alzer\frontend
npm run dev
```

### Test Steps

1. **Open Browser**
   - Navigate to: `http://localhost:3000/audio-cognitive-test`
   - Use Chrome or Edge for best results
   - Open DevTools Console (F12 → Console tab)

2. **Check Initialization**
   - Look for console logs:
     ```
     🔍 Browser support check: {speech: true, recognition: true}
     🔒 Protocol: http:
     🎙️ Microphone access granted
     ```
   - Allow microphone permission when prompted

3. **Start Test**
   - Click "Start Audio Test (3 Rounds)"
   - You should see Round 1 screen

4. **Listen Phase**
   - Click "Play Sentence"
   - Sentence plays aloud via text-to-speech
   - Screen automatically advances to recording phase

5. **Record Phase - THE FIX TEST**
   - Click "Start Recording"
   - Console should show:
     ```
     🎬 Starting recording with 1.5s delay...
     ▶️ Recognition start called
     🎤 Recognition started
     ```
   - Wait ~2 seconds
   - You should see:
     - "Preparing microphone..." (brief)
     - "🎤 Listening... Speak clearly" with pulsing mic icon
   
   **👉 THIS IS THE FIX - Recording should NOT stop immediately**

6. **Speak the Sentence**
   - Repeat the sentence you heard
   - Console should show:
     ```
     🗣️ Speech detected
     📝 Recognition result received, results count: X
     ✅ Final transcript chunk: [your words]
     💾 Accumulated final transcript: [full text]
     ```

7. **Stop Recording**
   - Either wait for auto-stop (10 seconds) or click "Stop Recording"
   - Console should show:
     ```
     🛑 Speech ended, will stop in 1 second...
     🏁 Recognition ended
     📄 Final text from ref: [your text]
     💾 Processing transcript: [your text]
     🔄 Comparing texts...
     ✅ Comparison result: {similarityScore: XX.X}
     ```

8. **View Results**
   - Screen shows:
     - Similarity score percentage
     - Original sentence
     - Your response
     - "Correct Recall!" or "Partial/Incorrect Recall"

9. **Complete All Rounds**
   - Click "Next Round" (or "Try Again" if you want to redo)
   - Repeat for Rounds 2 and 3
   - View summary with average score

## Expected Behavior (Fixed)

### ✅ What Should Work Now

1. **Stable Recognition**
   - Recording starts and stays active
   - No immediate shutdown
   - Microphone icon shows pulse animation

2. **Clear Feedback**
   - "Preparing microphone..." during 1.5s delay
   - "Listening... Speak clearly" when active
   - "Processing..." after stop

3. **Transcript Capture**
   - Speech captured reliably
   - Both interim and final results used
   - Transcript displayed in green box

4. **Auto-Stop**
   - Recording stops automatically after 10 seconds
   - Or stops when you click "Stop Recording"
   - Or stops 1 second after speechend event

5. **Multiple Rounds**
   - Each round starts fresh
   - No interference between recordings
   - All 3 rounds complete successfully

### ❌ What Was Broken Before

1. Recording started then stopped immediately
2. Error: "Could not recognize speech. Please try again."
3. Empty transcript even when speaking
4. useEffect recreating recognition mid-recording
5. Stale state causing incorrect flow

## Detailed Console Output (Expected)

```
[Initialization]
🔍 Browser support check: {speech: true, recognition: true}
🔒 Protocol: http:
🎙️ Microphone access granted

[User clicks "Start Recording"]
🎬 Starting recording with 1.5s delay...

[After 1.5s delay]
▶️ Recognition start called

[Recognition starts]
🎤 Recognition started

[User speaks]
🗣️ Speech detected
📝 Recognition result received, results count: 1
⏳ Interim transcript: the quick
📝 Recognition result received, results count: 2
✅ Final transcript chunk: the quick brown
💾 Accumulated final transcript: the quick brown
📝 Recognition result received, results count: 3
✅ Final transcript chunk: fox jumps over
💾 Accumulated final transcript: the quick brown fox jumps over
📝 Recognition result received, results count: 4
✅ Final transcript chunk: the lazy dog
💾 Accumulated final transcript: the quick brown fox jumps over the lazy dog

[User stops speaking]
🛑 Speech ended, will stop in 1 second...

[1 second later]
🏁 Recognition ended
📄 Final text from ref: the quick brown fox jumps over the lazy dog
💾 Processing transcript: the quick brown fox jumps over the lazy dog

[API call]
🔄 Comparing texts... {original: "The quick brown fox...", spoken: "the quick brown fox..."}
✅ Comparison result: {similarityScore: 95.2}
```

## Troubleshooting

### Issue: Mic permission denied
**Solution**: 
1. Click browser address bar lock icon
2. Site settings → Permissions → Microphone → Allow
3. Refresh page

### Issue: Still getting "Could not recognize speech"
**Solution**:
1. Check browser: Use Chrome or Edge (not Firefox)
2. Check protocol: localhost is OK, but HTTPS preferred
3. Check console for specific error
4. Try speaking louder and closer to mic

### Issue: No console logs appear
**Solution**:
1. Hard refresh: Ctrl + Shift + R
2. Clear cache and reload
3. Check if using correct URL: `http://localhost:3000/audio-cognitive-test`

### Issue: Build error in Next.js
**Note**: There's a pre-existing error in CognitiveSummary.tsx unrelated to this fix:
```
Type error: Argument of type 'string | 0' is not assignable to parameter of type 'string'.
```

**Temporary workaround**:
```bash
# Run in development mode (skips production build checks)
npm run dev
```

The AudioRecallTest component itself has no TypeScript errors.

## Success Criteria

✅ **Test passes if:**
1. Recording starts and stays active for at least 3 seconds
2. User can speak and see "Listening... Speak clearly"
3. Transcript captured and displayed
4. Similarity score calculated and shown
5. All 3 rounds complete without crashes
6. Console shows expected log sequence

❌ **Test fails if:**
1. Recording stops immediately after starting
2. "Could not recognize speech" appears for valid speech
3. Transcript is empty despite speaking
4. Browser crashes or page freezes
5. Cannot complete multiple rounds

## Performance Metrics

- **Mic initialization**: ~1.5 seconds
- **Recognition start**: ~200ms after delay
- **Speech detection**: Immediate when speaking
- **Auto-stop**: 10 seconds max
- **API comparison**: <500ms
- **Total per round**: ~30-60 seconds

## Browser-Specific Notes

### Chrome (Recommended)
- Full Web Speech API support
- Best recognition accuracy
- Fastest performance

### Edge (Recommended)
- Same Chromium engine as Chrome
- Identical support and performance

### Safari (Partial)
- Requires HTTPS (not localhost)
- May have slower recognition
- Consider using Chrome instead

### Firefox (Not Supported)
- No Web Speech API support
- Will show "Browser Not Supported" message
- Must use Chrome or Edge

## Next Steps After Test

If test passes:
1. ✅ Mark audio test as working
2. Test full cognitive assessment flow
3. Test on doctor/patient dashboards
4. Deploy to production

If test fails:
1. Share console logs
2. Note browser version and OS
3. Check microphone in other apps
4. Try different microphone device

---

**Test Plan Version**: 1.0  
**Date**: November 9, 2025  
**Component**: AudioRecallTest.tsx  
**Fix**: Speech recognition stability improvements
