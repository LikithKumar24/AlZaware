# Quick Test Guide - Cognitive Test Save Fix

## What Was Fixed
Fixed the 422 error when clicking "Save Results & Continue" in both Enhanced Cognitive Test and Audio-Based Cognitive Test.

## Quick Test (5 minutes)

### Test Enhanced Cognitive Test

1. **Start frontend and backend**
   ```bash
   # Terminal 1 - Backend
   cd Modelapi
   uvicorn main:app --reload

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Login**
   - Open http://localhost:3000/login
   - Email: `testing@gmail.com`
   - Password: `test@123`

3. **Take the test**
   - Navigate to http://localhost:3000/cognitive-test-enhanced
   - Click "Begin Assessment"
   - Complete at least one test (or skip through quickly for testing)
   - When you reach the summary page, open browser DevTools (F12) → Console tab

4. **Save results**
   - Click "Save Results & Continue"
   - **Watch the console** for:
     ```
     ✅ Saving Enhanced Cognitive Test results...
     📤 Payload: { ... }
     🔑 Token present: true
     ✅ Save successful: { ... }
     ```
   - Should redirect to MRI upload page
   - Should see alert: "Results saved successfully!"

### Test Audio Cognitive Test

1. **Navigate to audio test**
   - Go to http://localhost:3000/audio-cognitive-test
   - Complete the 3 rounds (or use demo mode if available)

2. **Save results**
   - After completing all rounds, click "Save Results"
   - Check console for success messages
   - Should redirect to results history

## Expected Behavior

### ✅ Success Indicators
- Button shows "Saving Results..." while processing
- Button is disabled during save
- Console shows detailed logging
- Alert shows "Results saved successfully!"
- Automatic redirect after save

### ❌ If You See Errors

**"No test results to save"**
- You need to complete at least one test before saving

**"Authentication token missing"**
- You need to log in first
- Should auto-redirect to login page

**"Session expired"**
- Token expired, log in again
- Should auto-redirect to login page

**422 Validation Error**
- Console will show: `Validation error: { detailed message }`
- This means payload doesn't match backend model
- Check console for the exact payload being sent
- Compare with backend Pydantic models

## Verify in Database

After saving, check if data was stored:

```bash
# Check if results are in MongoDB
# The backend should print:
📥 Received cognitive test result submission
   User: testing@gmail.com
   Test Type: Enhanced Cognitive Assessment
   Score: XX/100
✅ Test result saved with ID: <mongo_id>
```

## Console Debugging

If save fails, check console for:

1. **Payload structure**
   ```javascript
   {
     "test_type": "Enhanced Cognitive Assessment",
     "score": 75,              // Should be number, not string
     "total_questions": 100,
     "memory_score": 80,
     "attention_score": 70,
     ...
   }
   ```

2. **Token presence**
   ```
   🔑 Token present: true
   🔑 Token value: eyJhbGciOiJIUzI1NiIs...
   ```

3. **Error details** (if fails)
   ```
   ❌ Failed to save results: AxiosError
   Error details: {
     message: "Request failed with status code 422",
     response: { detail: [...] },
     status: 422
   }
   ```

## What Changed

### Frontend Improvements
- ✅ Added validation before save attempt
- ✅ Explicit type coercion (Number(), String(), Boolean())
- ✅ Better error messages with detailed validation info
- ✅ Loading state on button ("Saving Results...")
- ✅ Auto-redirect to login on auth failure
- ✅ Enhanced console logging for debugging

### Backend
- ✅ No changes needed (was already working correctly)

## Files Modified
1. `frontend/src/pages/cognitive-test-enhanced.tsx`
2. `frontend/src/pages/audio-cognitive-test.tsx`
3. `frontend/src/components/cognitive/CognitiveSummary.tsx`

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 422 Error | Check console for validation details; ensure all numeric fields are numbers not strings |
| 401 Error | Log in again; token expired or missing |
| No test results | Complete at least one test before clicking save |
| Button does nothing | Check if button is disabled; may already be saving |
| No redirect | Check browser console for JavaScript errors |

## Success Checklist
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Logged in as testing@gmail.com
- [ ] Completed at least one cognitive test
- [ ] Console shows detailed logs
- [ ] Save button shows "Saving Results..."
- [ ] Alert shows "Results saved successfully!"
- [ ] Redirected to next page
- [ ] Backend logs show test saved with ID

## Need More Help?

Check the full documentation:
- `COGNITIVE_TEST_SAVE_FIX_COMPLETE.md` - Complete technical details
- Browser DevTools → Network tab - See actual API requests/responses
- Backend terminal - See FastAPI logs
