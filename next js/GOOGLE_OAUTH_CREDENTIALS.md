# Where to Add Google OAuth Credentials

## Overview

You need to add your Google OAuth **Client ID** in two places:
1. **Frontend (Next.js)** - Required for Google Sign-In button
2. **Backend (FastAPI)** - Optional but recommended for token verification

**Note:** You do NOT need the Client Secret for this setup. The backend uses Google's public token verification endpoint.

---

## Step 1: Get Your Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find or create an **OAuth 2.0 Client ID**
4. Copy the **Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)

---

## Step 2: Add to Frontend (Required)

### Location
Create or edit: `cloudflow-web-frontend/next js/.env.local`

### Add this line:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### Example:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
```

### Important Notes:
- ✅ File must be named `.env.local` (not `.env`)
- ✅ Must be in the `next js` folder (same folder as `package.json`)
- ✅ Variable name must start with `NEXT_PUBLIC_` to be accessible in the browser
- ✅ **Restart your Next.js dev server** after adding/updating this file
- ✅ The `.env.local` file is already in `.gitignore` (won't be committed)

### Verify it's working:
1. Restart your dev server: `npm run dev`
2. Check browser console - you should see: "Current origin: http://localhost:3000"
3. The Google Sign-In button should appear

---

## Step 3: Add to Backend (Optional but Recommended)

### Location
Create or edit: `cloudflow-web-backend/.env`

### Add this line:
```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### Example:
```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
```

### Why it's optional:
The backend currently verifies Google tokens using Google's public `tokeninfo` endpoint, which doesn't require the client ID. However, adding it allows the backend to verify that tokens are specifically for your app (better security).

### To enable verification:
If you want the backend to verify the client ID, you'll need to update `cloudflow-web-backend/routers/auth.py` to check the `aud` (audience) field in the token response matches your `GOOGLE_CLIENT_ID`.

---

## Step 4: Configure Google Cloud Console

After adding the credentials, make sure your Google Cloud Console is configured:

### 1. Authorized JavaScript Origins
- Go to **APIs & Services** → **Credentials** → Your OAuth Client ID
- Under **Authorized JavaScript origins**, add:
  - `http://localhost:3000` (for development)
  - `https://yourdomain.com` (for production)

### 2. OAuth Consent Screen
- Go to **APIs & Services** → **OAuth consent screen**
- Complete all required fields
- Add your email as a test user (if app is in "Testing" mode)
- Add scopes: `openid`, `email`, `profile`

---

## File Structure

```
Backend/
├── cloudflow-web-backend/
│   └── .env                    ← Add GOOGLE_CLIENT_ID here (optional)
│
└── cloudflow-web-frontend/
    └── next js/
        └── .env.local          ← Add NEXT_PUBLIC_GOOGLE_CLIENT_ID here (required)
```

---

## Troubleshooting

### Frontend not working?
- ✅ Check `.env.local` file exists in `next js` folder
- ✅ Check variable name is exactly `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- ✅ Restart Next.js dev server after adding/changing `.env.local`
- ✅ Check browser console for errors
- ✅ Verify origin is added to Google Cloud Console

### Backend not working?
- ✅ Backend doesn't actually need the client ID to work (it's optional)
- ✅ If you add it, make sure it's in `.env` (not `.env.local`)
- ✅ Restart FastAPI server after adding/changing `.env`

### Still having issues?
See `GOOGLE_OAUTH_SETUP.md` for detailed troubleshooting.

