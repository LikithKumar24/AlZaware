# Login After Logout - Debugging Steps

## Current Issue
User reports that after logging out, they cannot log back in successfully.

## Diagnosis Checklist

### 1. Verify Backend is Running
```bash
curl http://127.0.0.1:8000/
# Should return: {"message": "Welcome to the AlzAware Prediction API!"}
```

### 2. Check Browser Console (F12)
When attempting to login after logout, look for:
- Network errors (red in Network tab)
- Console errors (red in Console tab)
- 401 Unauthorized errors
- CORS errors

### 3. Check Network Tab Details
**During Login Attempt:**
- POST to `http://127.0.0.1:8000/token`
- Status should be `200 OK`
- Response should contain: `access_token`, `token_type`, `user`
- Request payload: `username=...&password=...`

### 4. Check localStorage State
**Before Login:**
- `token`: should be null/empty
- `user`: should be null/empty

**After Failed Login:**
- Are values being set?
- Check Application → Local Storage → http://localhost:3000

### 5. Check Axios Headers
In browser console after failed login, run:
```javascript
// This shows current axios default headers
console.log(axios.defaults.headers.common);
```

## Common Issues and Fixes

### Issue 1: Form Not Submitting
**Symptom:** Click login button, nothing happens

**Check:**
1. Is `isLoading` state getting stuck as `true`?
2. Is there a JavaScript error preventing submission?
3. Is the form event being prevented?

**Fix:**
Add console logs to login page:
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  console.log('1. Form submitted'); // ADD THIS
  setError(null);
  setIsLoading(true);
  console.log('2. IsLoading set to true'); // ADD THIS
  
  try {
    console.log('3. Calling login with:', email); // ADD THIS
    await login(email, password);
    console.log('4. Login successful'); // ADD THIS
  } catch (err: any) {
    console.error('5. Login failed:', err); // ADD THIS
    // ... error handling
  } finally {
    console.log('6. Finally block'); // ADD THIS
    setIsLoading(false);
  }
};
```

### Issue 2: Axios Authorization Header Conflict
**Symptom:** Backend returns 401 even with correct credentials after logout

**Root Cause:** Stale Authorization header from previous session

**Verification:**
In AuthContext.tsx, ensure this line is present at the start of login():
```typescript
delete axios.defaults.headers.common['Authorization'];
```

### Issue 3: React State Not Updating
**Symptom:** Login appears to succeed but user state doesn't update

**Check:**
1. Is the `loading` state in AuthContext preventing render?
2. Is the user being redirected before state updates?

**Fix Applied:** 100ms delay before navigation
```typescript
await new Promise(resolve => setTimeout(resolve, 100));
router.push('/');
```

### Issue 4: LocalStorage Persistence
**Symptom:** User gets logged out on page refresh

**Check:**
- Is token being saved to localStorage?
- Is the useEffect hook in AuthContext loading from localStorage on mount?

**Verify in AuthContext.tsx:**
```typescript
useEffect(() => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (storedToken && storedUser) {
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
  }
  setLoading(false);
}, []);
```

### Issue 5: CORS or Network Error
**Symptom:** Network tab shows CORS error or request blocked

**Fix:**
Ensure backend CORS middleware allows:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 6: Backend Not Accepting Credentials
**Symptom:** Backend returns 401 with "Incorrect email or password"

**Check:**
1. Are credentials correct? (test with a fresh registration)
2. Is password hashing working properly?
3. Is backend actually running and connected to database?

**Test Backend Directly:**
```bash
curl -X POST "http://127.0.0.1:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass123"
```

Should return:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { ... }
}
```

## Step-by-Step Manual Test

### Step 1: Clean State
1. Open DevTools (F12)
2. Go to Application → Local Storage → http://localhost:3000
3. Right-click → Clear All
4. Refresh page

### Step 2: Initial Login
1. Go to http://localhost:3000/login
2. Enter credentials
3. Open Console tab and Network tab
4. Click "Login"
5. **Observe:**
   - Console logs
   - Network request to /token
   - Response data
   - Redirect behavior

### Step 3: Verify Logged-In State
1. Should be redirected to dashboard
2. Check Application → Local Storage
   - Should see `token` and `user` keys
3. Check Network tab on any API call
   - Should have header: `Authorization: Bearer eyJ...`

### Step 4: Logout
1. Click "Logout" button
2. **Observe:**
   - Redirect to /login
   - Local Storage cleared
   - Console logs

### Step 5: Re-Login (Critical Test)
1. **Still on /login page**
2. Enter SAME credentials
3. **Before clicking Login:**
   - Open Console
   - Open Network tab
   - Clear both tabs for clean view
4. Click "Login"
5. **Observe carefully:**
   - Network tab: POST to /token - what status?
   - Console: any errors?
   - What happens after click?

## Advanced Debugging

### Add Detailed Logging to AuthContext

Replace the login function temporarily:

```typescript
const login = useCallback(async (email: string, password: string) => {
  console.log('[LOGIN] Starting login process');
  
  try {
    console.log('[LOGIN] Clearing existing auth header');
    delete axios.defaults.headers.common['Authorization'];
    console.log('[LOGIN] Auth header cleared:', axios.defaults.headers.common);
    
    console.log('[LOGIN] Preparing request params');
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    
    console.log('[LOGIN] Sending request to backend');
    const response = await axios.post('http://127.0.0.1:8000/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    console.log('[LOGIN] Response received:', response.data);
    const { access_token, user } = response.data;
    
    console.log('[LOGIN] Setting axios auth header');
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    console.log('[LOGIN] Auth header set');
    
    console.log('[LOGIN] Updating React state');
    setToken(access_token);
    setUser(user);
    
    console.log('[LOGIN] Saving to localStorage');
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    console.log('[LOGIN] localStorage updated');
    
    console.log('[LOGIN] Waiting 100ms for state propagation');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('[LOGIN] Navigating to home');
    router.push('/');
    console.log('[LOGIN] Login process complete');
  } catch (error) {
    console.error('[LOGIN] Error occurred:', error);
    console.error('[LOGIN] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}, [router]);
```

### Check for Race Conditions

Add logging to logout:

```typescript
const logout = useCallback(() => {
  console.log('[LOGOUT] Starting logout process');
  
  console.log('[LOGOUT] Clearing React state');
  setToken(null);
  setUser(null);
  
  console.log('[LOGOUT] Clearing localStorage');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  console.log('[LOGOUT] Removing authorization header');
  delete axios.defaults.headers.common['Authorization'];
  console.log('[LOGOUT] Auth header after delete:', axios.defaults.headers.common);
  
  console.log('[LOGOUT] Navigating to login');
  router.push('/login');
  console.log('[LOGOUT] Logout complete');
}, [router]);
```

## Expected Console Output

### Successful Login After Logout:
```
[LOGOUT] Starting logout process
[LOGOUT] Clearing React state
[LOGOUT] Clearing localStorage
[LOGOUT] Removing authorization header
[LOGOUT] Auth header after delete: {}
[LOGOUT] Navigating to login
[LOGOUT] Logout complete

(User enters credentials and clicks login)

[LOGIN] Starting login process
[LOGIN] Clearing existing auth header
[LOGIN] Auth header cleared: {}
[LOGIN] Preparing request params
[LOGIN] Sending request to backend
[LOGIN] Response received: { access_token: "eyJ...", token_type: "bearer", user: {...} }
[LOGIN] Setting axios auth header
[LOGIN] Auth header set
[LOGIN] Updating React state
[LOGIN] Saving to localStorage
[LOGIN] localStorage updated
[LOGIN] Waiting 100ms for state propagation
[LOGIN] Navigating to home
[LOGIN] Login process complete
```

## What to Report

If login still fails after these checks, provide:

1. **Console Output:** Copy all console logs
2. **Network Tab:** Screenshot of /token request and response
3. **Error Message:** Exact error shown in UI
4. **Browser:** Chrome/Firefox/Safari version
5. **Steps:** Exact sequence of actions taken
6. **localStorage State:** Before and after login attempt

## Quick Fix if Issue Persists

If the documented fix doesn't work, try this alternative approach:

### Option 1: Force Clear on Page Load
Add to login page:
```typescript
useEffect(() => {
  // Force clear auth state when login page loads
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
}, []);
```

### Option 2: Create New Axios Instance
Instead of using default axios, create a fresh instance for each login:
```typescript
const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

const response = await axiosInstance.post('/token', params);
```

### Option 3: Hard Refresh After Logout
Add to logout function:
```typescript
const logout = useCallback(() => {
  setToken(null);
  setUser(null);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  
  // Force reload to clear all state
  window.location.href = '/login';
}, []);
```

## Success Criteria

Login is working when:
- ✅ Logout clears all state
- ✅ Login form submits successfully
- ✅ Backend returns 200 with token
- ✅ User is redirected to dashboard
- ✅ Protected routes are accessible
- ✅ Can repeat logout/login multiple times
