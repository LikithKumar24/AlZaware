# Quick Test Guide: Login After Logout Fix

## What Was Fixed
The login-after-logout issue has been resolved with enhanced state management that:
- Clears ALL authentication state before each login attempt
- Validates server responses
- Adds comprehensive error handling and logging
- Cleans up state on errors

## How to Test Right Now

### Step 1: Start the Application

#### Terminal 1 - Start Backend
```bash
cd Modelapi
python main.py
```
Wait for: `[INFO] Model loaded and ready.`

#### Terminal 2 - Start Frontend
```bash
cd frontend
npm run dev
```
Wait for: `ready - started server on 0.0.0.0:3000`

### Step 2: Open Browser with DevTools

1. Open Chrome or Firefox
2. Press **F12** to open DevTools
3. Open these tabs:
   - **Console** (to see logs)
   - **Network** (to see requests)
   - **Application → Local Storage** (to see storage)

### Step 3: Test Initial Login

1. Navigate to: `http://localhost:3000/login`
2. Enter your credentials:
   - Email: `test@example.com` (or your test account)
   - Password: `your_password`
3. Click **"Login"**

**Watch Console - You should see:**
```
[LoginPage] Mounted - clearing any stale auth state
[LoginPage] Form submitted with email: test@example.com
[LoginPage] Calling login function
[AuthContext] Starting login process for: test@example.com
[AuthContext] Cleared previous auth state
[AuthContext] Sending login request to backend
[AuthContext] Login response received: 200
[AuthContext] Setting auth header and state
[AuthContext] Auth state updated successfully
[AuthContext] Navigating to home page
[LoginPage] Login successful
```

**Expected Result:** ✅ You are redirected to the dashboard

### Step 4: Test Logout

1. Find the **"Logout"** button (usually in header/sidebar)
2. Click it

**Watch Console - You should see:**
```
[AuthContext] Starting logout process
[AuthContext] All auth state cleared
[AuthContext] Current axios headers: {}
```

**Check Application → Local Storage:**
- Should be EMPTY (no `token` or `user` keys)

**Expected Result:** ✅ You are redirected to `/login`

### Step 5: Test Re-Login (THE CRITICAL TEST)

1. You should still be on `/login` page
2. **Check Console** - You should see:
   ```
   [LoginPage] Mounted - clearing any stale auth state
   ```
3. Enter the SAME credentials you used before
4. Click **"Login"**

**Watch Console - Should see the FULL login sequence again:**
```
[LoginPage] Form submitted with email: test@example.com
[LoginPage] Calling login function
[AuthContext] Starting login process for: test@example.com
[AuthContext] Cleared previous auth state
[AuthContext] Sending login request to backend
[AuthContext] Login response received: 200
[AuthContext] Setting auth header and state
[AuthContext] Auth state updated successfully
[AuthContext] Navigating to home page
[LoginPage] Login successful
```

**Expected Result:** ✅ You are successfully logged in and redirected to dashboard

### Step 6: Test Multiple Cycles

Repeat 3-4 times:
1. Logout
2. Login

**Expected Result:** ✅ Each cycle works identically without errors

## What If It Still Doesn't Work?

### Check 1: Backend Running?
```bash
curl http://127.0.0.1:8000/
```
Should return: `{"message":"Welcome to the AlzAware Prediction API!"}`

### Check 2: Frontend Running?
Open: `http://localhost:3000/login`
Should show the login page

### Check 3: Console Errors?
Look in Console tab for red errors. Common issues:
- ❌ CORS error → Backend not allowing localhost:3000
- ❌ 401 error → Wrong credentials or backend issue
- ❌ Network error → Backend not running

### Check 4: Network Tab
Click on the POST request to `/token`:
- **Status:** Should be `200 OK` (not 401, 404, 500)
- **Response:** Should contain `access_token` and `user`

### Check 5: Clear Browser Cache
If nothing works:
1. Press **Ctrl+Shift+Delete**
2. Clear "Cached images and files"
3. Clear "Cookies and site data"
4. Try again in **Incognito/Private window**

## Success Indicators

✅ Login works the first time  
✅ Logout clears all data from Local Storage  
✅ Login works the second time (after logout)  
✅ Console shows complete log sequences  
✅ Network tab shows 200 responses  
✅ No red errors in console  
✅ Can repeat login/logout multiple times  

## Common Error Messages

### "Incorrect email or password"
- **Cause:** Credentials don't match database
- **Fix:** Double-check email and password, or register a new user

### "Failed to login. Please check your credentials"
- **Cause:** Backend not responding or network error
- **Fix:** Check backend is running on port 8000

### "Invalid response from server: missing access_token or user"
- **Cause:** Backend returning wrong format
- **Fix:** Check backend `/token` endpoint is working

### No error, but nothing happens when clicking Login
- **Cause:** JavaScript error preventing form submission
- **Fix:** Check Console tab for red errors

## Quick Debug Commands

Open Console (F12) and run:

```javascript
// Check what's in localStorage
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// Check axios headers
console.log('Axios headers:', axios.defaults.headers.common);

// Force clear everything (if stuck)
localStorage.clear();
delete axios.defaults.headers.common['Authorization'];
window.location.href = '/login';
```

## Files That Were Changed

1. **`frontend/src/context/AuthContext.tsx`**
   - Enhanced login with full state cleanup
   - Enhanced logout with logging
   - Added error recovery

2. **`frontend/src/pages/login.tsx`**
   - Added cleanup on page mount
   - Enhanced error handling
   - Added detailed logging

## Need More Help?

If login still fails after following these steps, collect this information:

1. **Copy entire Console output** (both successful and failed attempts)
2. **Screenshot of Network tab** showing the `/token` request
3. **Screenshot of Local Storage** state (Application tab)
4. **Exact error message** shown in the UI
5. **Browser and version** (Chrome 120, Firefox 121, etc.)

Share this information so we can diagnose the specific issue.

---

**The fix is complete and should work now. Open your browser, press F12, and follow the steps above to verify!**
