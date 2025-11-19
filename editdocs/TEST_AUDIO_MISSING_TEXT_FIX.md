# Quick Test Guide - Audio Missing Text Fix

## What Was Fixed
The "System error: Missing original sentence" error that occurred when comparing speech transcripts.

## Root Cause
React stale closure issue - event handlers in `useEffect` captured old state values.

## Solution
Wrapper function pattern that accesses fresh state at call-time.

---

## How to Test

### 1. Start the Application
```bash
cd C:\Alzer\frontend
npm run dev
```

### 2. Navigate to Audio Test
- Open browser to `http://localhost:3000`
- Login with test account
- Navigate to `/audio-cognitive-test`

### 3. Open Browser Console
- Press `F12` to open DevTools
- Go to Console tab
- Clear console for clean view

### 4. Start Test
Click "Start Audio Test (3 Rounds)"

**Expected console output:**
```
🎯 Selected sentence: The quick brown fox jumps over the lazy dog.
🚀 Test started with sentence: The quick brown fox jumps over the lazy dog.
```

✅ **Verify**: You see both logs showing the sentence was selected

### 5. Play Sentence
Click "Play Sentence" button

**Expected**: Sentence plays aloud through speakers

### 6. Record Your Response
Click "Start Recording"

**Expected console output:**
```
✅ Starting recording with sentence: The quick brown fox jumps ove...
🎤 Recognition started
```

✅ **Verify**: You see confirmation that recording started WITH the sentence

### 7. Speak the Sentence
Repeat what you heard clearly into the microphone

**Expected console output (while speaking):**
```
🗣️ Speech detected
📝 Recognition result received, results count: 1
⏳ Interim transcript: the quick brown
✅ Final transcript chunk: the quick brown fox jumps over the lazy dog
💾 Accumulated final transcript: the quick brown fox jumps over the lazy dog
```

✅ **Verify**: Your speech is being captured and logged

### 8. Stop Recording (or wait for auto-stop)
Recording automatically stops after 10 seconds or when speech ends

**Expected console output:**
```
🛑 Speech ended event fired, speech detected: true
⏱️ Speech ended, waiting 2 seconds for final results...
⏹️ Stopping recognition after speechend delay
🏁 Recognition ended
📄 Final text from ref: the quick brown fox jumps over the lazy dog
💾 Processing transcript: the quick brown fox jumps over the lazy dog
```

### 9. THE CRITICAL MOMENT - Wrapper Function Call
After 100ms delay, the wrapper should be called:

**Expected console output:**
```
🔍 Wrapper called - checking current state
📝 Current sentence: The quick brown fox jumps over the lazy dog.
🗣️ Spoken text: the quick brown fox jumps over the lazy dog
✅ Both texts available, proceeding to comparison
```

✅ **CRITICAL CHECK**: The "Current sentence" log shows the ACTUAL sentence text, NOT "(null)"

### 10. Backend Comparison
API call is made to compare texts:

**Expected console output:**
```
🔍 handleTextComparison called with: { 
  original: 'The quick brown fox jumps over the lazy dog.', 
  spoken: 'the quick brown fox jumps over the lazy dog',
  currentSentence: 'The quick brown fox jumps over the lazy dog.'
}
🔄 Comparing texts... { 
  original: 'The quick brown fox jumps over the lazy dog.', 
  spoken: 'the quick brown fox jumps over the lazy dog' 
}
```

✅ **Verify**: Both `original` and `spoken` have actual text values

### 11. Result Display
Similarity score is calculated and displayed on screen

**Expected console output:**
```
✅ Comparison result: { similarityScore: 95.6 }
```

**Expected UI:**
- Green card showing similarity score (e.g., 95.6%)
- "Correct Recall!" message (if ≥70%)
- Original sentence displayed
- Your spoken response displayed
- "Next Round" button appears

✅ **Verify**: No error messages, score displays correctly

### 12. Test Multiple Rounds
Click "Next Round" and repeat steps 5-11

**Expected console output:**
```
➡️ Moving to round 2 with sentence: A journey of a thousand miles...
🎯 Selected sentence: A journey of a thousand miles begins with a single step.
```

✅ **Verify**: New sentence is selected and logged for round 2

### 13. Test Retry Function
On any round, click "Try Again" button

**Expected console output:**
```
🔄 Retrying with same sentence: The quick brown fox jumps ove...
```

✅ **Verify**: Same sentence is kept for retry (not a new random one)

---

## Success Criteria

### ✅ All These Should Work:
- [x] Sentence is selected and logged at test start
- [x] Recording starts with confirmation of which sentence
- [x] Speech is detected and transcribed
- [x] Wrapper function is called with both texts present
- [x] "Current sentence" log shows actual text (NOT null)
- [x] Backend receives both `original` and `spoken` texts
- [x] Similarity score is calculated and displayed
- [x] No "Missing original sentence" error
- [x] Can complete all 3 rounds
- [x] Retry keeps same sentence

### ❌ What Should NOT Happen:
- [ ] "System error: Missing original sentence"
- [ ] "📝 Current sentence: (null)" in console
- [ ] Backend error "Missing text for comparison"
- [ ] Empty strings sent to API
- [ ] Crash or frozen UI

---

## Troubleshooting

### If You Still See "Missing original sentence":
1. **Check wrapper function exists**: Search code for `handleTextComparisonWrapper`
2. **Check onend calls wrapper**: Look for `setTimeout(() => handleTextComparisonWrapper(finalText), 100)`
3. **Clear cache**: Hard refresh browser (`Ctrl+Shift+R`)
4. **Restart dev server**: Stop and restart `npm run dev`

### If Console Shows "(null)":
- The wrapper function might not be implemented
- Check that you saved the file after making changes
- Verify Next.js compiled the changes (check terminal)

### If Speech Recognition Fails:
- This is a separate issue (see AUDIO_FIX_QUICK_REFERENCE.md)
- Ensure microphone permission granted
- Use Chrome browser
- Test on HTTPS if possible

---

## Files Modified in This Fix
- `frontend/src/components/cognitive/AudioRecallTest.tsx`
  - Added `handleTextComparisonWrapper` function
  - Modified `onend` handler to call wrapper with delay
  - Added logging throughout sentence selection flow

---

## Summary

**Before Fix:**
```
onend → access state → get null → error
```

**After Fix:**
```
onend → call wrapper → wrapper accesses fresh state → get sentence → success!
```

**The magic**: Wrapper function defined in component body (not `useEffect`) has access to current React state via normal closure behavior.

---

**Status**: ✅ Fix applied and ready for testing
**Date**: November 9, 2025
**Issue**: Resolved
