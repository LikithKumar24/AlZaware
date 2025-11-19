# Quick Test Guide - Login After Logout Fix

## Before You Start

### 1. Clear Browser Cache (CRITICAL)
```
Ctrl + Shift + Delete → Clear "Cached images and files" → Click "Clear data"
```

### 2. Restart Frontend
```bash
cd frontend
# Stop server (Ctrl+C)
Remove-Item -Recurse -Force .next
npm run dev
```

### 3. Open DevTools
- Press `F12`
- Go to Console tab
- Check "Preserve log" checkbox

## Test Steps

### Test 1: Fresh Login
```
1. Go to http://localhost:3000/login
2. Enter: testing@gmail.com / test@123
3. Click "Login"
4. ✅ Should redirect to dashboard
5. ✅ Should see "Welcome, [Name]!"
```

**Expected Console:**
```
[LoginPage] Mounted - clearing any stale auth state
[AuthContext] Starting login process for: testing@gmail.com
[AuthContext] Login response received: 200
[AuthContext] Auth state updated successfully
[AuthContext] Navigating to home page
```

### Test 2: Logout
```
1. Click "Logout" button in header
2. ✅ Should redirect to login page
3. ✅ Should NOT see user info
```

**Expected Console:**
```
[AuthContext] Starting logout process
[AuthContext] All auth state cleared
[AuthContext] localStorage token: null
[AuthContext] Navigating to login page
```

### Test 3: Login Again (CRITICAL)
```
1. Enter SAME credentials: testing@gmail.com / test@123
2. Click "Login"
3. ✅ Should work EXACTLY like Test 1
4. ✅ Should redirect to dashboard
5. ✅ Should see "Welcome, [Name]!" again
```

**Expected Console:**
```
Should be IDENTICAL to Test 1 output
```

### Test 4: Repeat Cycle
```
1. Logout again
2. Login again
3. Repeat 2-3 times
4. ✅ Should work every time
```

## What to Look For

### ✅ Good Signs
- Login works on first try
- Logout redirects to login page
- Login works on second try
- No console errors
- No "Incorrect email or password" with valid credentials
- Console logs appear as expected

### ❌ Bad Signs (If You See These)
- Login button does nothing
- "Incorrect email or password" with correct credentials
- Console errors about tokens
- Stuck on login page after clicking login
- Network tab shows 401 errors

## If Test Fails

### Quick Fix 1: Hard Refresh
```
Ctrl + Shift + R
```

### Quick Fix 2: Restart Everything
```bash
# Stop both servers (Ctrl+C in each terminal)

# Backend
cd Modelapi
python main.py

# Frontend (new terminal)
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

### Quick Fix 3: Clear Browser Completely
```
1. Close ALL browser tabs
2. Open NEW incognito window
3. Go to http://localhost:3000/login
4. Try again
```

## Verification Checklist

After successful test:
- [ ] First login works
- [ ] Logout redirects to login
- [ ] Second login works
- [ ] Third login works
- [ ] Console logs appear correctly
- [ ] No errors in console
- [ ] No errors in Network tab
- [ ] localStorage clears after logout
- [ ] localStorage fills after login

## Test with Application Tab

1. Open DevTools → Application tab
2. Go to Local Storage → http://localhost:3000

### After Login:
```
token: "eyJ..."
user: "{\"id\":\"...\",\"email\":\"testing@gmail.com\",...}"
```

### After Logout:
```
(empty)
```

### After Second Login:
```
token: "eyJ..."  (NEW token)
user: "{\"id\":\"...\",\"email\":\"testing@gmail.com\",...}"
```

## Quick Diagnostic Commands

### Check if Backend is Running:
```bash
curl http://127.0.0.1:8000/
```

### Test Backend Login Directly:
```bash
curl -X POST "http://127.0.0.1:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testing@gmail.com&password=test@123"
```

Should return:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {...}
}
```

## Common Issues

### Issue: "Login button does nothing"
**Fix:** Clear `.next` folder and restart frontend

### Issue: "Incorrect email or password"
**Fix:** Check backend is running, verify credentials in database

### Issue: "No console logs"
**Fix:** Enable "Preserve log" in DevTools Console

### Issue: "Still not working"
**Fix:** See full troubleshooting in `LOGIN_LOGOUT_COMPREHENSIVE_FIX.md`

---

**Time to Complete:** 2-3 minutes  
**Success Rate:** Should be 100% after cache clear
