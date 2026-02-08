# ✅ FIREBASE SETUP CHECKLIST

**Follow these steps in order. Check each box as you complete it.**

---

## 📝 SETUP CHECKLIST

### [ ] 1. Enable Firestore Database
- Open: https://console.firebase.google.com/project/attendance-management-sy-9d277/firestore
- Click **"Create Database"**
- Select **"Start in production mode"**
- Choose location (e.g., `us-central` or closest to you)
- Click **"Enable"**
- ⏱️ Wait 1-2 minutes for database to initialize

---

### [ ] 2. Deploy Firestore Security Rules

**EASIEST METHOD (Copy-Paste):**
1. Open this file in VS Code: `firestore.rules`
2. Select ALL content (Ctrl+A)
3. Copy (Ctrl+C)
4. Go to: https://console.firebase.google.com/project/attendance-management-sy-9d277/firestore/rules
5. Delete any existing rules
6. Paste your rules (Ctrl+V)
7. Click **"Publish"**
8. Confirm publish

**Alternative (Firebase CLI - if you want):**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

---

### [ ] 3. Enable Email/Password Authentication
- Open: https://console.firebase.google.com/project/attendance-management-sy-9d277/authentication/providers
- Click **"Email/Password"**
- Toggle **"Enable"** to ON
- Click **"Save"**

---

### [ ] 4. Restart Your Dev Server
```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
# Open http://localhost:3000
```

---

### [ ] 5. Test Sign Up
1. Go to: http://localhost:3000
2. Click **"Get Started"** or **"Sign Up"**
3. Fill in:
   - Full Name
   - Email
   - Password
   - Organization Name
   - Organization Type
4. Click **"Create Account"**
5. You should be redirected to Dashboard

**✅ Success means:** You see the dashboard with your organization name

---

### [ ] 6. Add Your First Attendance Record
1. Click **"Add Attendance"** in sidebar
2. Select today's date
3. Choose event type (e.g., "Sunday Service")
4. Enter total attendance (e.g., 150)
5. (Optional) Add visitors
6. Click **"Save Attendance"**

**✅ Success means:** You see a success message with confetti 🎉

---

### [ ] 7. Verify Data in Firebase Console
- Open: https://console.firebase.google.com/project/attendance-management-sy-9d277/firestore/data
- You should see these collections:
  - ✅ `users` (contains your user)
  - ✅ `organizations` (contains your org)
  - ✅ `services` (contains attendance records)
  - ✅ `visitors` (if you added any)

---

## 🐛 TROUBLESHOOTING

### Problem: "Index Required" Error

**What it means:** Firebase needs to create database indexes for complex queries

**Fix:**
1. Look for the error message in browser console (F12)
2. The error will contain a **clickable link**
3. Click the link - it opens Firebase Console
4. Firebase auto-generates the index
5. Wait 2-5 minutes for index to build
6. Refresh your page

**Manual Creation:**
- Go to: https://console.firebase.google.com/project/attendance-management-sy-9d277/firestore/indexes
- Click **"Create Index"**
- Collection: `services`
- Fields:
  - `organizationId` (Ascending)
  - `serviceDate` (Descending)

---

### Problem: "Permission Denied" Error

**Fix:** Your firestore.rules are not deployed. Go back to Step 2.

---

### Problem: Can't Sign Up

**Fix:** Authentication not enabled. Go back to Step 3.

---

### Problem: Page is Blank

**Check:**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red errors
4. Common errors:
   - Firebase config missing → Check `.env.local` file exists
   - Auth not enabled → Do Step 3
   - Rules not deployed → Do Step 2

---

## ✨ VERIFICATION TEST

After completing all steps, you should be able to:

- ✅ Sign up / Sign in
- ✅ See dashboard with stats
- ✅ Add attendance records
- ✅ View visitors page
- ✅ See analytics charts
- ✅ Edit existing events
- ✅ Delete events
- ✅ Switch organizations (if you create multiple)

---

## 📧 STILL STUCK?

If you completed all steps but still have issues:

1. Check browser console (F12) for errors
2. Check terminal where `npm run dev` is running for errors
3. Try signing out and signing in again
4. Try creating a new organization (Settings > Organizations)
5. Check Firebase Console to see if data is being created

**Most common issue:** Index not created yet. Wait 5 minutes after the first "Index Required" error and create the index through the clickable link.

---

## 🎉 YOU'RE DONE!

Once all checkboxes are checked, your Insight Tracker app is fully operational!
