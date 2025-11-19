# Audio Cognitive Test - Testing Checklist

## Pre-Testing Setup

### 1. Start the Application
```bash
# Terminal 1 - Backend (if needed)
cd C:\Alzer\Modelapi
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd C:\Alzer\frontend
npm run dev
```

### 2. Open Browser
- **Recommended**: Google Chrome or Microsoft Edge
- Navigate to: `http://localhost:3000/audio-cognitive-test`
- Open Developer Console: Press `F12`

---

## Functional Testing

### ✅ Test 1: Initial Load
- [ ] Page loads without errors
- [ ] Microphone status banner appears
- [ ] Status shows: ✅ Microphone Active (green) OR ❌ Access Denied (red)
- [ ] "Start Audio Test" button visible
- [ ] If denied, button shows "Microphone Access Required" and is disabled

### ✅ Test 2: Start Test
- [ ] Click "Start Audio Test (3 Rounds)"
- [ ] Transitions to "Listen" phase for Round 1
- [ ] "Play Sentence" button visible
- [ ] No errors in console

### ✅ Test 3: Play Sentence (Round 1)
- [ ] Click "Play Sentence"
- [ ] Browser speaks sentence aloud
- [ ] Volume icon animates (pulse effect)
- [ ] After playback, automatically transitions to "Record" phase

### ✅ Test 4: Record Speech (Round 1)
- [ ] "Start Recording" button visible
- [ ] Click "Start Recording"
- [ ] **CRITICAL**: UI shows "Preparing microphone..." for 1.5 seconds
- [ ] Then UI shows "🎤 Listening... Speak clearly"
- [ ] Microphone icon pulses with red animation
- [ ] Speak the sentence clearly
- [ ] Recognition stops automatically
- [ ] Transcript appears in green box: "✅ Your Response Captured: [text]"

### ✅ Test 5: View Results (Round 1)
- [ ] Similarity score displays (e.g., "85.5%")
- [ ] Status shows: "Correct Recall!" (green) OR "Partial/Incorrect Recall" (orange)
- [ ] Original sentence displayed
- [ ] Your response displayed
- [ ] "Next Round" button visible
- [ ] "Try Again" button visible

### ✅ Test 6: Complete Rounds 2 & 3
- [ ] Click "Next Round"
- [ ] Repeat Play → Record → Results for Round 2
- [ ] Click "Next Round"
- [ ] Repeat Play → Record → Results for Round 3
- [ ] After Round 3, click "View Summary"

### ✅ Test 7: Summary Page
- [ ] Average recall accuracy displayed
- [ ] Performance rating shown (Excellent/Good/Fair)
- [ ] Correct recalls count shown (e.g., "2/3")
- [ ] All 3 rounds listed with scores
- [ ] "Save Results & Continue" button visible

### ✅ Test 8: Save Results
- [ ] Click "Save Results & Continue"
- [ ] No errors in console
- [ ] Redirects to results history page
- [ ] Test result appears in history

---

## Console Log Testing

### ✅ Test 9: Verify Console Logs

Open browser console (F12) and verify the following logs appear:

**On Page Load:**
- [ ] `🔍 Browser support check: {speech: true, recognition: true}`
- [ ] `🔒 Protocol: http:`
- [ ] `🎙️ Microphone access granted`

**On Click "Start Recording":**
- [ ] `🎬 Starting recording with 1.5s delay...`
- [ ] `▶️ Recognition start called`
- [ ] `🎤 Recognition started`

**When You Speak:**
- [ ] `🗣️ Speech detected`
- [ ] `📝 Recognition result received`
- [ ] `✅ Final transcript: [your spoken text]`

**After Speech Ends:**
- [ ] `🏁 Recognition ended`
- [ ] `💾 Processing transcript: [your text]`

---

## Error Handling Testing

### ✅ Test 10: Microphone Permission Denied
- [ ] Block microphone in browser settings
- [ ] Refresh page
- [ ] Status shows: "❌ Microphone Access Denied"
- [ ] Error message explains how to enable permissions
- [ ] "Start Audio Test" button disabled
- [ ] Console shows: `❌ Microphone access denied`

### ✅ Test 11: No Speech Detected (Retry Logic)
- [ ] Start recording
- [ ] Wait for "🎤 Listening..." indicator
- [ ] **Stay completely silent** (don't speak)
- [ ] After ~5 seconds, console shows: `⚠️ Speech recognition error: no-speech`
- [ ] Console shows: `🔄 Retrying... (Attempt 1/2)`
- [ ] UI shows: "Couldn't hear you. Retrying... (Attempt 1/2)"
- [ ] **Stay silent again**
- [ ] Console shows: `🔄 Retrying... (Attempt 2/2)`
- [ ] **Stay silent third time**
- [ ] UI shows: "No voice detected after 2 attempts. Please check your microphone."
- [ ] "Try Again" button appears

### ✅ Test 12: HTTPS Warning (if applicable)
- [ ] If testing on non-localhost HTTP, verify warning banner appears
- [ ] Warning text: "⚠️ Speech recognition may be unreliable without HTTPS"

### ✅ Test 13: Manual Stop Recording
- [ ] Start recording
- [ ] Wait for "Listening..." state
- [ ] Click "Stop Recording" button before speaking
- [ ] Recording stops gracefully
- [ ] No errors in console
- [ ] Can click "Start Recording" again

---

## Browser Compatibility Testing

### ✅ Test 14: Chrome/Edge (Recommended)
- [ ] All features work correctly
- [ ] Speech recognition reliable
- [ ] Transcript accuracy high (>80%)
- [ ] No browser-specific errors

### ✅ Test 15: Safari (Limited Support)
- [ ] Page loads correctly
- [ ] May require user interaction before audio plays
- [ ] Speech recognition may have shorter timeout
- [ ] Test still completable

### ✅ Test 16: Firefox (Expected to Fail)
- [ ] Page shows: "Browser Not Supported"
- [ ] Error message explains: "Speech Recognition (Voice input) is not available"
- [ ] Recommends Chrome, Edge, or Safari

---

## Performance Testing

### ✅ Test 17: Multiple Rounds in Succession
- [ ] Complete all 3 rounds without refreshing
- [ ] No memory leaks (check browser Task Manager)
- [ ] Audio playback doesn't degrade
- [ ] Recognition speed consistent

### ✅ Test 18: Retry Multiple Tests
- [ ] Complete test once
- [ ] Go back to `/audio-cognitive-test`
- [ ] Start test again
- [ ] Everything works correctly
- [ ] No stale state from previous test

---

## Edge Cases Testing

### ✅ Test 19: Very Long Sentence
- [ ] Speak a very long response (>30 seconds)
- [ ] Transcript captured fully
- [ ] No truncation

### ✅ Test 20: Background Noise
- [ ] Play music or ambient noise
- [ ] Attempt recording
- [ ] May affect accuracy but shouldn't crash
- [ ] Retry logic still works

### ✅ Test 21: Fast Speech
- [ ] Speak very quickly
- [ ] Transcript may be less accurate
- [ ] System still captures something
- [ ] Similarity score reflects quality

### ✅ Test 22: Accented Speech
- [ ] Speak with non-American accent
- [ ] Recognition may be less accurate
- [ ] System doesn't crash
- [ ] Transcript shows best attempt

---

## Regression Testing

### ✅ Test 23: Other Cognitive Tests Still Work
- [ ] Navigate to `/cognitive-test-enhanced`
- [ ] Verify Memory Recall Test works
- [ ] Verify Stroop Test works
- [ ] Verify Digit Span Test works
- [ ] Verify Reaction Time Test works
- [ ] Verify Trail Making Test works

### ✅ Test 24: Dashboard Navigation
- [ ] Navigate to dashboard
- [ ] All links work
- [ ] No JavaScript errors
- [ ] Audio test card visible in assessment page

---

## Backend Integration Testing

### ✅ Test 25: API Endpoint - Compare Text
```bash
curl -X POST http://127.0.0.1:8000/compare-text \
  -H "Content-Type: application/json" \
  -d '{"original":"The quick brown fox","spoken":"The brown fox"}'
```
- [ ] Returns: `{"similarityScore": <number>}`
- [ ] Score is between 0-100

### ✅ Test 26: API Endpoint - Save Results
- [ ] Complete audio test
- [ ] Click "Save Results & Continue"
- [ ] Network tab shows POST to `/cognitive-tests/audio-recall`
- [ ] Request includes Authorization header
- [ ] Response is 200 OK
- [ ] Results appear in database/history

### ✅ Test 27: JWT Token Handling
- [ ] Complete test while logged in
- [ ] Log out
- [ ] Try to access results endpoint
- [ ] Verify 401 Unauthorized or redirect to login

---

## Final Verification

### ✅ Test 28: Complete End-to-End Flow
1. [ ] Fresh browser session (clear cache)
2. [ ] Navigate to assessment page
3. [ ] Click "Audio-Based Cognitive Test"
4. [ ] Grant microphone permission
5. [ ] Complete all 3 rounds successfully
6. [ ] Verify summary accurate
7. [ ] Save results
8. [ ] View in results history
9. [ ] No errors at any step
10. [ ] Console logs match expected output

---

## Success Criteria

**The fix is successful if:**

✅ All checkboxes above are checked  
✅ "Preparing microphone..." appears before "Listening..."  
✅ Auto-retry works on silent attempts  
✅ Transcript captured reliably (>95% success rate)  
✅ Console logs show all expected messages  
✅ No JavaScript errors in console  
✅ Similarity scores calculated correctly  
✅ Results save to backend  
✅ No breaking changes to other features  

---

## Issue Reporting Template

If you find issues, report with:

```
**Issue**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happened]

**Browser**: [Chrome/Edge/Safari/Firefox + version]
**Console Errors**: [Copy/paste errors from F12 console]
**Console Logs**: [Copy/paste relevant logs]

**Screenshot**: [If applicable]
```

---

## Test Results Summary

| Test Category | Pass/Fail | Notes |
|--------------|-----------|-------|
| Functional Testing | ☐ Pass ☐ Fail | |
| Console Log Testing | ☐ Pass ☐ Fail | |
| Error Handling | ☐ Pass ☐ Fail | |
| Browser Compatibility | ☐ Pass ☐ Fail | |
| Performance | ☐ Pass ☐ Fail | |
| Edge Cases | ☐ Pass ☐ Fail | |
| Regression | ☐ Pass ☐ Fail | |
| Backend Integration | ☐ Pass ☐ Fail | |
| End-to-End | ☐ Pass ☐ Fail | |

**Overall Status**: ☐ PASS ☐ FAIL

**Tester Name**: _______________  
**Date**: _______________  
**Environment**: _______________  

---

**Status**: Ready for Testing ✅  
**Priority**: High (Core Feature Fix)  
**Blocking Issues**: None  

---

## Quick Test (3 Minutes)

If short on time, run this minimal test:

1. ✅ Navigate to `/audio-cognitive-test`
2. ✅ Verify microphone status green
3. ✅ Start test → Play sentence → Record
4. ✅ Speak the sentence
5. ✅ Verify transcript captured
6. ✅ Check console logs appear
7. ✅ Complete all 3 rounds
8. ✅ Save results

**If all 8 steps pass, core functionality is working.**
