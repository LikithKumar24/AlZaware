# Diagnosing the Login After Logout Issue

## Current Status
Based on the codebase review, comprehensive fixes have already been applied to both `AuthContext.tsx` and `login.tsx`. However, you reported the issue still occurs.

## Possible Remaining Issues

### 1. Browser Caching
**Symptom:** Old JavaScript code is cached in the browser
**Solution:**
```bash
# Hard refresh in browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# OR clear browser cache completely
```

### 2. Next.js Build Cache
**Symptom:** Old compiled code is being served
**Solution:**
```bash
cd frontend
# Delete build caches
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
# Reinstall and rebuild
npm install
npm run dev
```

### 3. Multiple Browser Tabs
**Symptom:** State conflicts between tabs
**Solution:**
- Close ALL browser tabs running the app
- Open fresh incognito/private window
- Test login → logout → login cycle

### 4. Backend Session Issues
**Symptom:** Backend not accepting valid credentials after logout
**Solution:**
```bash
# Restart backend completely
cd Modelapi
# Stop current process (Ctrl+C)
python main.py
```

## Step-by-Step Diagnosis

### Step 1: Open Browser DevTools
1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Go to **Network** tab
4. Go to **Application** → **Local Storage**

### Step 2: Test Login Flow
1. Navigate to `http://localhost:3000/login`
2. Open Console and run:
   ```javascript
   console.clear();
   ```
3. Enter credentials and click Login
4. **Watch Console** - You should see logs starting with `[AuthContext]` and `[LoginPage]`
5. **Watch Network** - You should see POST to `/token` with 200 response

**Expected Console Output:**
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

### Step 3: Check Local Storage After Login
1. In DevTools → Application → Local Storage → `http://localhost:3000`
2. You should see:
   - `token`: (JWT string)
   - `user`: (JSON object)

### Step 4: Test Logout
1. Click Logout button
2. **Watch Console** - You should see:
   ```
   [AuthContext] Starting logout process
   [AuthContext] All auth state cleared
   [AuthContext] Current axios headers: {}
   ```
3. **Check Local Storage** - Should be empty

### Step 5: Test Re-Login (CRITICAL)
1. Enter same credentials
2. Click Login
3. **Watch Console** - Should see exact same sequence as Step 2

**If it fails, note:**
- What error appears in console?
- What's the Network response status?
- What's in Local Storage?

## Common Failure Scenarios

### Scenario A: "Incorrect email or password" on second login
**Cause:** Backend database issue or password hash mismatch
**Debug:**
```bash
# Check backend console for errors
# Test backend directly with curl
curl -X POST "http://127.0.0.1:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"
```

### Scenario B: Network error on second login
**Cause:** CORS issue or backend not responding
**Debug:**
- Check if backend is still running
- Check Network tab for CORS errors
- Verify backend console shows the request

### Scenario C: Login button does nothing
**Cause:** JavaScript error or stale state
**Debug:**
- Check Console for JavaScript errors
- Check if form submit event fires
- Try hard refresh (Ctrl+Shift+R)

### Scenario D: Successful login but doesn't redirect
**Cause:** Router navigation blocked
**Debug:**
```javascript
// In console after "login"
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
console.log('Current URL:', window.location.href);
```

## Verification Script
You can use the test HTML file created:
1. Open `test_login_logout_flow.html` in browser
2. Update email/password if needed
3. Click through the steps and watch the log

## Quick Fix Checklist

Try these in order:

1. ✅ **Hard refresh browser** (Ctrl+Shift+R)
2. ✅ **Clear browser cache completely**
3. ✅ **Use incognito window**
4. ✅ **Delete frontend .next folder and restart**:
   ```bash
   cd frontend
   Remove-Item -Recurse -Force .next
   npm run dev
   ```
5. ✅ **Restart backend**:
   ```bash
   cd Modelapi
   # Ctrl+C to stop
   python main.py
   ```
6. ✅ **Clear localStorage manually**:
   ```javascript
   // In browser console
   localStorage.clear();
   window.location.href = '/login';
   ```

## If Issue Persists

### Collect Diagnostics
1. **Console logs** - Copy all console output during failed login
2. **Network tab** - Right-click on failed request → Copy → Copy as cURL
3. **Local Storage** - Screenshot of Local Storage state
4. **Backend logs** - Copy any error messages from backend console

### Provide Details
- Browser name and version
- Exact steps to reproduce
- Error messages (frontend and backend)
- Network request/response details

## Nuclear Option: Complete Reset

If nothing works, try complete reset:

```bash
# 1. Stop all servers
# Press Ctrl+C in both frontend and backend terminals

# 2. Clear frontend completely
cd frontend
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install
npm run dev

# 3. Restart backend
cd ../Modelapi
python main.py

# 4. Clear browser completely
# - Close all tabs
# - Clear all browsing data
# - Restart browser
# - Open in incognito mode
# - Test flow
```

## Expected Working Flow

✅ **First Login**
- POST /token → 200 OK
- localStorage populated
- Redirect to /
- User sees dashboard

✅ **Logout**
- localStorage cleared
- Redirect to /login
- User sees login form

✅ **Second Login**
- POST /token → 200 OK (same as first time)
- localStorage populated
- Redirect to /
- User sees dashboard

The second login should work **identically** to the first login.

## Code Verification

If the issue persists after all above steps, we may need to verify the code itself:

```bash
# Check AuthContext has all fixes
cat frontend/src/context/AuthContext.tsx | Select-String -Pattern "Cleared previous auth state"

# Check login page has all fixes  
cat frontend/src/pages/login.tsx | Select-String -Pattern "Mounted - clearing"
```

Both should return matches if fixes are applied.

## Support Commands

### Force Clear All Auth State
Run in browser console:
```javascript
// Nuclear option - clear everything
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
delete window.axios?.defaults?.headers?.common?.['Authorization'];
console.log('All auth state cleared');
window.location.href = '/login';
```

### Test Backend Directly
```bash
# Test if backend accepts login
curl -X POST "http://127.0.0.1:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"

# Should return:
# {"access_token": "...", "token_type": "bearer", "user": {...}}
```

### Check MongoDB Connection
```bash
# In backend console, you should see:
# [INFO] Connected to MongoDB Atlas.
# [INFO] Model loaded and ready.
```

---

**Next Steps:**
1. Follow the diagnosis steps above
2. Note exactly which step fails
3. Collect the diagnostic information
4. Report back with specific error details
