# Audio Test Speech Recognition Fix

## Issue Summary
The Audio-Based Cognitive Test was failing with "Error: Could not recognize speech" immediately after starting. Speech recognition would start but stop instantly without capturing any audio input.

## Root Causes Identified

1. **Incorrect Recognition Settings**
   - `continuous: false` - caused recognition to stop after first result
   - `interimResults: false` - prevented capturing partial results
   - No `maxAlternatives` set - limited recognition accuracy

2. **No Microphone Warm-up Delay**
   - Recognition started immediately without allowing microphone initialization
   - Browser needs 1-2 seconds to activate audio input

3. **Missing Retry Logic**
   - "no-speech" errors had no automatic retry mechanism
   - Users had to manually restart the entire test

4. **Poor Error Handling**
   - Generic error messages without specific guidance
   - No distinction between different error types (no-speech, not-allowed, aborted)

5. **No Microphone Permission Check**
   - Component didn't verify microphone access before test started
   - Led to confusing errors when permission was denied

6. **Missing State Tracking**
   - No way to track if recognition was actively listening vs. just started
   - Transcript could be lost if not stored in a ref

## Fixes Applied

### 1. Updated Speech Recognition Configuration
```javascript
recognitionRef.current.continuous = true;        // Keep listening
recognitionRef.current.interimResults = true;    // Capture partial results
recognitionRef.current.lang = 'en-US';
recognitionRef.current.maxAlternatives = 3;      // Better accuracy
```

### 2. Added Microphone Permission Check
- Runs on component mount via `navigator.mediaDevices.getUserMedia()`
- Shows clear status: ✅ Microphone Active / ❌ Access Denied
- Disables test start button if permission denied

### 3. Implemented 1.5-Second Delay
```javascript
setTimeout(() => {
  recognitionRef.current?.start();
}, 1500);
```
- Allows microphone hardware to initialize
- Prevents "no-speech" errors from premature start

### 4. Added Comprehensive Event Handlers
- `onstart` - Confirms recognition started
- `onspeechstart` - Detects actual speech
- `onspeechend` - Marks end of utterance
- `onresult` - Captures both interim and final transcripts
- `onerror` - Handles all error types with specific messages
- `onend` - Processes final transcript

### 5. Automatic Retry Logic (Max 2 Attempts)
```javascript
if (event.error === 'no-speech') {
  if (retryCount < 2) {
    setRetryCount(retryCount + 1);
    setTimeout(() => handleStartRecording(), 2000);
  } else {
    setErrorMessage('No voice detected after 2 attempts.');
  }
}
```

### 6. Enhanced UI Feedback
- **Preparing microphone...** - Shows during 1.5s warm-up
- **🎤 Listening... Speak clearly** - Active recording state
- **Processing your response...** - Backend comparison in progress
- **Retry attempt X of 2** - Clear retry indicator
- Error messages with specific guidance for each failure type

### 7. Added Console Logging for Debugging
- 🔍 Browser support check
- 🔒 Protocol verification (HTTPS)
- 🎙️ Microphone access status
- 🎤 Recognition start/stop events
- 🗣️ Speech detection confirmation
- 📝 Transcript capture logs
- ⚠️ All error types with context

### 8. Cross-Browser Compatibility
- Detects and uses both `SpeechRecognition` and `webkitSpeechRecognition`
- Shows browser compatibility notice (recommends Chrome/Edge)
- Warns if not using HTTPS

### 9. Transcript Storage in Ref
```javascript
const transcriptRef = useRef<string>('');
```
- Prevents transcript loss from state updates
- Ensures final text is captured even if component re-renders

### 10. Error-Specific Handling
- **no-speech**: Auto-retry up to 2 times
- **aborted**: Silent handling (user stopped)
- **not-allowed**: Permission denied message
- **network**: Backend connection issues
- Other errors: Generic retry guidance

## New State Variables Added

```javascript
const [errorMessage, setErrorMessage] = useState('');
const [retryCount, setRetryCount] = useState(0);
const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
const [isListening, setIsListening] = useState(false);
const transcriptRef = useRef<string>('');
```

## Files Modified

- `frontend/src/components/cognitive/AudioRecallTest.tsx`

## Testing Instructions

1. **Test Normal Flow**
   - Start the audio test
   - Verify microphone permission granted
   - Click "Start Recording"
   - Wait for "Listening..." indicator
   - Speak the sentence clearly
   - Verify transcript captured correctly

2. **Test Microphone Permission**
   - Block microphone in browser settings
   - Refresh page
   - Verify "❌ Microphone Access Denied" appears
   - Verify "Start Test" button is disabled

3. **Test Retry Logic**
   - Click "Start Recording"
   - Stay silent (don't speak)
   - Verify automatic retry (Attempt 1/2)
   - Stay silent again
   - Verify error message after 2 attempts

4. **Test Browser Console**
   - Open developer console (F12)
   - Start recording
   - Verify diagnostic logs appear:
     - 🎤 Recognition started
     - 🗣️ Speech detected (when you speak)
     - 📝 Recognition result received
     - ✅ Final transcript: [your text]

5. **Test HTTPS Warning**
   - If on localhost, verify no warning
   - If on http (not https), verify warning banner

## Expected Behavior After Fix

✅ Microphone initializes properly with 1.5s delay  
✅ Recognition stays active until speech detected  
✅ Transcript captured reliably  
✅ Auto-retry on "no-speech" errors (max 2 attempts)  
✅ Clear UI feedback for all states  
✅ Specific error messages with actionable guidance  
✅ Console logs confirm mic and recognition events  
✅ No more "Error: Could not recognize speech" for valid input  

## Browser Requirements

**Recommended**: Google Chrome or Microsoft Edge  
**Supported**: Safari (with limitations)  
**Not Supported**: Firefox (limited Web Speech API support)

**Best Environment**: HTTPS with microphone permission granted

## Future Improvements (Optional)

1. Add visual waveform animation while recording
2. Allow manual transcript editing before submission
3. Add audio level indicator to confirm mic is active
4. Support multiple languages beyond en-US
5. Add noise cancellation hints for better accuracy
6. Allow users to replay their own recording

## Notes

- The fix maintains backward compatibility with all existing features
- No changes to backend endpoints required
- All UI styling matches the existing design system
- Component still works on both desktop and mobile (where supported)
