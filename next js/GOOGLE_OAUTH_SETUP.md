# Google OAuth Setup Troubleshooting Guide

## Common Errors

### Error 1: FedCM AbortError
```
[GSI_LOGGER]: FedCM get() rejects with AbortError: signal is aborted without reason
```

### Error 2: IdentityCredentialError (Most Common)
```
[GSI_LOGGER]: FedCM get() rejects with IdentityCredentialError: Error retrieving a token
```

**This error usually means one of the following:**

### 1. Missing Environment Variable

**Problem:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not set or not accessible.

**Solution:**
1. Create a `.env.local` file in the `next js` folder (if it doesn't exist)
2. Add your Google Client ID:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
3. **Restart your Next.js development server** (important!)
4. Clear your browser cache and reload the page

### 2. Incorrect Google Cloud Console Configuration

**Problem:** Authorized JavaScript origins or redirect URIs are not set correctly.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, make sure you have:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
6. Click **Save**
7. Wait 1-2 minutes for changes to propagate

### 3. OAuth Consent Screen Not Configured (MOST COMMON FIX)

**Problem:** The OAuth consent screen is not properly set up or the app is in testing mode without test users.

**Solution:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Make sure you've completed all required steps:
   - **App information**: Name, User support email, Developer contact information
   - **Scopes**: Click "Add or Remove Scopes" and add:
     - `openid`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - **Test users** (CRITICAL if app is in "Testing" mode):
     - Click "Add Users"
     - Add your Google email address (the one you'll use to sign in)
     - Save
3. **Publishing Status:**
   - If your app is in "Testing" mode, you MUST add test users
   - To make it available to everyone, click "PUBLISH APP" (requires verification for production)
   - For development, "Testing" mode with your email as a test user is fine
4. Save all changes and wait 1-2 minutes

### 4. Browser/Network Issues

**Problem:** Browser blocking the request or network issues.

**Solution:**
1. Try a different browser (Chrome, Firefox, Edge)
2. Disable browser extensions temporarily
3. Check browser console for additional errors
4. Try in incognito/private mode
5. Clear browser cache and cookies

### 5. Development vs Production

**Problem:** Using production Client ID in development or vice versa.

**Solution:**
- For local development (`localhost:3000`), make sure your Client ID has `http://localhost:3000` in authorized origins
- For production, use `https://` URLs only
- You may need separate Client IDs for development and production

## Quick Checklist

- [ ] `.env.local` file exists in `next js` folder
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- [ ] Next.js dev server has been restarted after adding env variable
- [ ] Google Cloud Console has `http://localhost:3000` in authorized origins
- [ ] OAuth consent screen is fully configured (all steps completed)
- [ ] **If app is in "Testing" mode: Your email is added as a test user**
- [ ] Required scopes are added (openid, email, profile)
- [ ] Browser cache cleared
- [ ] No browser extensions blocking requests

## Most Common Fix for IdentityCredentialError

**90% of the time, this error is because:**
1. Your app is in "Testing" mode in OAuth consent screen
2. Your email is NOT added as a test user
3. **OR** the OAuth consent screen is not fully configured

**Step-by-Step Fix:**

### Step 1: Configure OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Complete ALL required fields:
   - **App name**: Enter your app name (e.g., "CloudFlow")
   - **User support email**: Your email
   - **App logo**: (Optional)
   - **Application home page**: `http://localhost:3000` (for dev)
   - **Application privacy policy link**: (Can be a placeholder for testing)
   - **Application terms of service link**: (Can be a placeholder for testing)
   - **Authorized domains**: Leave empty for localhost
   - **Developer contact information**: Your email
5. Click **SAVE AND CONTINUE**

### Step 2: Add Scopes
1. On the "Scopes" page, click **ADD OR REMOVE SCOPES**
2. Add these scopes:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Click **UPDATE** then **SAVE AND CONTINUE**

### Step 3: Add Test Users (CRITICAL!)
1. On the "Test users" page, click **ADD USERS**
2. **Add the EXACT Google email address you're using to sign in**
3. Click **ADD**
4. Click **SAVE AND CONTINUE**

### Step 4: Review and Publish
1. Review the summary
2. Click **BACK TO DASHBOARD**
3. **IMPORTANT**: If your app is in "Testing" mode, you MUST add test users
4. If you want to make it public (not recommended for development), click **PUBLISH APP**

### Step 5: Verify Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, ensure:
   - `http://localhost:3000` is listed
4. Under **Authorized redirect URIs**, ensure:
   - `http://localhost:3000` is listed
5. Click **SAVE**

### Step 6: Wait and Test
1. Wait 2-3 minutes for changes to propagate
2. Clear your browser cache
3. Try signing in again

**If you still get the error after these steps:**
- Make sure you're using the EXACT email you added as a test user
- Check that both frontend and backend have the same `GOOGLE_CLIENT_ID`
- Try a different browser or incognito mode
- Check browser console for more specific error messages

## Testing

1. Open browser console (F12)
2. Look for any error messages
3. Check if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is logged (it won't show the value, but you can check if it exists)
4. Try clicking the "Continue with Google" button
5. Check the Network tab for any failed requests

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Verify your Google Client ID is correct (should end with `.apps.googleusercontent.com`)
3. Make sure you're using the correct project in Google Cloud Console
4. Try creating a new OAuth 2.0 Client ID if the current one isn't working

