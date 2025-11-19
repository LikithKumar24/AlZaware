# Quick Test Guide: Login & Results History Fixes

## Prerequisites
- Backend running on http://127.0.0.1:8000
- Frontend running on http://localhost:3000
- Test user: `testing@gmail.com` / `test@123`

## Test 1: Login After Logout (5 minutes)

### Steps:
1. **Open browser console** (F12) to see debug logs
2. Navigate to http://localhost:3000/login
3. Login with `testing@gmail.com` / `test@123`
4. Wait for redirect to dashboard
5. Click **Logout** button
6. **Observe:** Page fully reloads (URL changes to /login)
7. **Check console logs:**
   ```
   [AuthContext] ====== LOGOUT INITIATED ======
   [AuthContext] axios headers cleared
   [AuthContext] localStorage cleared
   ```
8. Enter same credentials again: `testing@gmail.com` / `test@123`
9. Click **Login**

### Expected Result:
✅ Login succeeds without 401 error
✅ User is redirected to dashboard
✅ Console shows successful login logs

### Common Issues:
❌ If you still get 401: Clear browser cache and cookies, then retry
❌ If page doesn't reload on logout: Check that AuthContext.tsx uses `window.location.href = '/login'`

---

## Test 2: Results History Page (10 minutes)

### Setup:
First, ensure test data exists:

#### Create Enhanced Cognitive Test result:
1. Navigate to `/cognitive-test-enhanced`
2. Complete all 5 cognitive tests
3. Click "Save Results & Continue"
4. Verify success message

#### Create Audio Recall Test result:
1. Navigate to `/audio-cognitive-test`
2. Complete 3 rounds of audio recall
3. Click "Save Results"
4. Verify success message

### Test Steps:
1. Navigate to `/results-history`
2. **Observe three card sections:**
   - 🧠 MRI Scan Assessments
   - 🧠 Cognitive Test Results
   - 🎤 Audio-Based Cognitive Tests

3. **Verify Cognitive Test Results table shows:**
   - Date (formatted as "Jan 10, 2025")
   - Test Type: "Enhanced Cognitive"
   - Overall Score (e.g., "86/100")
   - Performance level with color (e.g., "Excellent" in green)
   - Details column with:
     - Memory: XX
     - Attention: XX
     - Speed: XX
     - Executive: XX

4. **Verify Audio-Based Tests table shows:**
   - Date
   - Score (e.g., "92/100")
   - Accuracy (e.g., "89.2%")
   - Correct Recalls (e.g., "2/3")
   - Performance level with color

### Expected Results:
✅ All three sections display correctly
✅ Test data appears in tables
✅ Performance levels show with correct colors:
   - ≥85% → "Excellent" (green)
   - 70-84% → "Good" (blue)
   - 50-69% → "Fair" (yellow)
   - <50% → "Needs Attention" (red)
✅ Dates are formatted properly
✅ No console errors

### If No Data Appears:
1. Check browser console for errors
2. Open Network tab and check API responses:
   - `GET /cognitive-tests/` should return array
   - `GET /cognitive-tests/audio-recall` should return array
3. Verify token is being sent in Authorization header
4. Check backend logs for errors

### API Call Verification:
Open browser DevTools → Network tab → Filter: XHR

Expected calls on page load:
```
GET http://127.0.0.1:8000/assessments/
  Status: 200
  Headers: Authorization: Bearer <token>

GET http://127.0.0.1:8000/cognitive-tests/
  Status: 200
  Headers: Authorization: Bearer <token>

GET http://127.0.0.1:8000/cognitive-tests/audio-recall
  Status: 200
  Headers: Authorization: Bearer <token>
```

---

## Test 3: Error Handling (2 minutes)

### Test expired token:
1. Open browser console
2. Run: `localStorage.setItem('token', 'invalid_token')`
3. Refresh `/results-history` page
4. **Expected:** Red error banner appears: "Session expired. Please log in again."
5. **Expected:** Auto-redirect to login after 2 seconds

### Test with no results:
1. Create a new user account
2. Login as new user
3. Navigate to `/results-history`
4. **Expected:** Each section shows: "No [type] found."

---

## Console Commands for Quick Testing

### Clear all auth state:
```javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
delete axios.defaults.headers.common['Authorization'];
window.location.reload();
```

### Check current auth state:
```javascript
console.log({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  axios_header: axios.defaults.headers.common['Authorization']
});
```

### Simulate logout:
```javascript
localStorage.clear();
window.location.href = '/login';
```

---

## Backend Verification

### Check if test results exist in MongoDB:
```python
# Run in backend Python shell
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check_data():
    client = AsyncIOMotorClient("mongodb+srv://...")
    db = client.alzAwareDB
    
    # Count cognitive tests
    count = await db.cognitive_tests.count_documents({"owner_email": "testing@gmail.com"})
    print(f"Cognitive tests: {count}")
    
    # Count audio recall tests
    count = await db.audio_recall_tests.count_documents({"owner_email": "testing@gmail.com"})
    print(f"Audio recall tests: {count}")

asyncio.run(check_data())
```

---

## Success Criteria

### Login/Logout:
- [x] Can logout successfully
- [x] Page fully reloads on logout
- [x] Can login again without 401 error
- [x] No stale auth headers in axios
- [x] Console logs show proper cleanup sequence

### Results History:
- [x] Three separate card sections display
- [x] Enhanced Cognitive Test results appear with subscores
- [x] Audio Recall Test results appear with accuracy
- [x] Performance levels display with correct colors
- [x] Empty state messages show when no data
- [x] Error handling works for expired tokens
- [x] All API calls succeed with proper auth headers

---

## Troubleshooting

### Issue: Still getting 401 on login
**Solution:** 
1. Completely close browser
2. Reopen and clear all site data
3. Ensure backend is running
4. Try login again

### Issue: Results History shows empty
**Solution:**
1. Check Network tab for API responses
2. Verify test data exists in MongoDB
3. Check that token in localStorage is valid
4. Ensure backend endpoints return 200 status

### Issue: Console errors about missing modules
**Solution:**
```bash
cd frontend
npm install lucide-react
npm install
```

### Issue: Performance colors not showing
**Solution:**
Check that Tailwind classes are not being purged. Add to `tailwind.config.js`:
```javascript
safelist: [
  'text-green-600',
  'text-blue-600',
  'text-yellow-600',
  'text-red-600',
]
```

---

## Quick Rollback (If Issues Occur)

If the fixes cause problems, you can rollback:

```bash
git checkout HEAD~1 -- frontend/src/context/AuthContext.tsx
git checkout HEAD~1 -- frontend/src/pages/results-history.tsx
```

Then restart the frontend server.

---

## Contact

If issues persist, check:
1. Browser console for JavaScript errors
2. Backend terminal for Python errors
3. Network tab for failed API calls
4. MongoDB Atlas for data verification

All fixes are documented in `LOGIN_AND_RESULTS_FIX.md`.
