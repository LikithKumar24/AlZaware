# Diagnose Login After Logout Issue

## Current Status
The login-after-logout fix was previously implemented in AuthContext.tsx and login.tsx.
However, you're reporting that it's still not working.

## Possible Issues

### 1. **Browser Cache / Storage Persistence**
The issue might be browser-related rather than code-related:
- Corrupted localStorage
- Service workers caching old state
- Browser cookies not clearing

**Quick Fix:**
```
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Close and reopen browser
5. Try login → logout → login again
```

### 2. **Token Expiry Handling**
If the token expires between logout and re-login, the axios interceptor might still try to use it.

**Check:** Look for axios interceptors in the codebase that might be interfering.

### 3. **Race Condition in State Updates**
The 150ms delay might not be enough on slower systems.

**Potential Fix:** Increase delay to 300ms in AuthContext.tsx:
```typescript
await new Promise(resolve => setTimeout(resolve, 300));
```

### 4. **Backend Session Management**
The backend might be maintaining session state that conflicts with new logins.

**Check:** 
- Does the backend use sessions or JWTs?
- Are old tokens being properly invalidated?

### 5. **React Strict Mode Double Rendering**
In development, React Strict Mode causes components to render twice, which can cause issues.

**Check:** Look at _app.tsx for `<React.StrictMode>`

## Diagnostic Steps

### Step 1: Check Console Logs
When you attempt login → logout → login, you should see:

**First Login:**
```
[AuthContext] Starting login process for: user@example.com
[AuthContext] Cleared previous auth state
[AuthContext] Setting auth header and state
[AuthContext] Navigating to home page
```

**Logout:**
```
[AuthContext] Starting logout process
[AuthContext] All auth state cleared
```

**Second Login:**
```
[LoginPage] Mounted - clearing any stale auth state
[AuthContext] Starting login process for: user@example.com
[AuthContext] Cleared previous auth state
[AuthContext] Setting auth header and state
[AuthContext] Navigating to home page
```

**If you DON'T see these logs:** The fix isn't applied or the build is stale.
**If you DO see these logs but login fails:** Check the next section.

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Attempt to login after logout
4. Look at the `/token` request:
   - **Status 200:** Backend accepted credentials (frontend issue)
   - **Status 401:** Backend rejected credentials (check username/password)
   - **No request at all:** Frontend is blocking the request

### Step 3: Check localStorage
After logout, check Application → Local Storage → http://localhost:3000:
- **token** should be DELETED
- **user** should be DELETED

If they still exist, the logout function isn't working properly.

### Step 4: Check axios Headers
Add this temporary diagnostic in login.tsx handleSubmit:

```typescript
console.log('Before login - axios headers:', axios.defaults.headers.common);
await login(email, password);
console.log('After login - axios headers:', axios.defaults.headers.common);
```

Headers should be empty before login and contain Authorization after login.

## Common Symptoms & Solutions

### Symptom: "Login works first time but fails after logout"
**Cause:** Stale auth headers or localStorage not being cleared
**Solution:** Ensure logout function properly clears all state (already implemented)

### Symptom: "Login button does nothing after logout"
**Cause:** React state not updating or form submission blocked
**Solution:** Check if isLoading state is stuck at true

### Symptom: "Login redirects immediately to login page"
**Cause:** Auth redirect logic in _app.tsx or middleware
**Solution:** Check for redirect logic that conflicts with auth state

### Symptom: "Error: Could not validate credentials"
**Cause:** Old token being sent with login request
**Solution:** Ensure no Authorization header is sent with /token request (already implemented)

## Immediate Actions

### Action 1: Rebuild Frontend
```bash
cd frontend
npm run build
npm run dev
```

Sometimes the development server caches old code.

### Action 2: Clear All Browser Data
1. Close all browser tabs
2. Open browser settings
3. Clear all browsing data (cookies, cache, site data)
4. Restart browser
5. Test login flow

### Action 3: Test in Incognito/Private Mode
This eliminates browser extension and cache interference.

### Action 4: Check for Multiple Axios Instances
Search codebase for other axios.create() instances that might not be getting the header updates.

## If Nothing Works

### Nuclear Option: Force Fresh State
Add this to the top of the login function in AuthContext.tsx:

```typescript
// Force complete reset
window.localStorage.clear();
window.sessionStorage.clear();
for (const key in axios.defaults.headers.common) {
  delete axios.defaults.headers.common[key];
}
```

This is aggressive but ensures absolutely clean state.

## Testing Script

Create this test file: `test_login_flow.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Login Flow Test</title>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body>
  <h1>Login Flow Test</h1>
  <button onclick="testLogin()">Test Login</button>
  <button onclick="testLogout()">Test Logout</button>
  <button onclick="testReLogin()">Test Re-Login</button>
  <pre id="output"></pre>

  <script>
    const API = 'http://127.0.0.1:8000';
    let token = null;

    function log(msg) {
      document.getElementById('output').innerText += msg + '\n';
      console.log(msg);
    }

    async function testLogin() {
      try {
        log('--- Testing First Login ---');
        const params = new URLSearchParams();
        params.append('username', 'testing@gmail.com');
        params.append('password', 'test@123');
        
        const response = await axios.post(`${API}/token`, params);
        token = response.data.access_token;
        
        log('✅ Login successful');
        log(`Token: ${token.substring(0, 20)}...`);
      } catch (error) {
        log('❌ Login failed: ' + error.message);
      }
    }

    function testLogout() {
      log('--- Testing Logout ---');
      token = null;
      delete axios.defaults.headers.common['Authorization'];
      log('✅ Logout complete');
    }

    async function testReLogin() {
      try {
        log('--- Testing Re-Login ---');
        delete axios.defaults.headers.common['Authorization'];
        
        const params = new URLSearchParams();
        params.append('username', 'testing@gmail.com');
        params.append('password', 'test@123');
        
        const response = await axios.post(`${API}/token`, params);
        token = response.data.access_token;
        
        log('✅ Re-login successful');
        log(`Token: ${token.substring(0, 20)}...`);
      } catch (error) {
        log('❌ Re-login failed: ' + error.message);
      }
    }
  </script>
</body>
</html>
```

Open this in a browser and test if the backend itself works for login → logout → re-login.

## Expected Behavior

After implementing all fixes:
1. ✅ User logs in → sees dashboard
2. ✅ User clicks logout → redirected to login page
3. ✅ localStorage cleared (token + user removed)
4. ✅ axios headers cleared (no Authorization header)
5. ✅ User enters credentials again → logs in successfully
6. ✅ Token and user stored in localStorage
7. ✅ Authorization header set in axios
8. ✅ User sees dashboard

## Next Steps

1. Follow the diagnostic steps above
2. Report what you see in the console
3. Check the network tab for the /token request
4. Share any error messages
5. Try the test script to isolate if it's frontend or backend

This will help identify the exact point of failure.
