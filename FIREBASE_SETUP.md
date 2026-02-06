# Firebase Setup Guide
## Christhood Ministry Attendance Management System

Complete step-by-step guide to set up Firebase for your attendance management system.

---

## Prerequisites

- Google account
- Node.js and npm installed
- Project files downloaded

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `christhood-attendance` (or your preferred name)
4. Click **Continue**
5. **Google Analytics**: Enable or disable (optional for this project)
6. Click **Create project**
7. Wait for project creation (30-60 seconds)
8. Click **Continue** when done

---

## Step 2: Register Your Web App

1. In Firebase Console, click the **Web icon** (`</>`) on the project homepage
2. Register app:
   - **App nickname**: `Christhood Attendance Web`
   - **Firebase Hosting**: Leave unchecked for now
   - Click **Register app**
3. **Copy the Firebase configuration**:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
4. Click **Continue to console**

---

## Step 3: Configure Environment Variables

1. Open your project folder
2. Open the `.env.local` file
3. Replace the placeholder values with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```
4. Save the file

---

## Step 4: Enable Billing (Required for Firestore)

**Important**: Firebase requires a billing account to use Firestore, even on the free tier. You won't be charged unless you exceed the generous free limits.

1. Visit the billing page:
   - Go to [Enable Billing](https://console.developers.google.com/billing/enable?project=attendance-management-sy-9d277)
   - Or in Firebase Console: Click **"Upgrade"** button (top right)
   
2. **Add Payment Method**:
   - Click **"Add a billing account"**
   - Select your country
   - Enter your payment information (credit/debit card)
   - Click **"Submit and enable billing"**

3. **Select Free Plan (Spark Plan)**:
   - After billing is enabled, you'll stay on the **Spark Plan (Free)**
   - No charges unless you exceed free tier limits (very unlikely for church attendance)

**Note**: Adding billing is required, but you can set budget alerts to notify you if costs approach any amount.

---

## Step 5: Enable Firestore Database

1. In Firebase Console, click **"Build"** in left sidebar
2. Click **"Firestore Database"**
3. Click **"Create database"**
4. Choose a location:
   - **Start mode**: Select **"Start in test mode"** (we'll add rules later)
   - Click **Next**
   - **Cloud Firestore location**: Choose closest to your users (e.g., `us-central`)
   - Click **Enable**
5. Wait for database creation (30-60 seconds)

---

## Step 6: Configure Firestore Security Rules

1. In Firestore Database, click the **"Rules"** tab
2. Replace the default rules with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       
       // Services collection
       match /services/{serviceId} {
         // Allow anyone to read service records
         allow read: if true;
         
         // Allow anyone to create service records
         allow create: if true;
         
         // Allow update if the document exists
         allow update: if exists(/databases/$(database)/documents/services/$(serviceId));
         
         // Allow delete
         allow delete: if true;
         
         // Visitors sub-collection
         match /visitors/{visitorId} {
           allow read, write: if true;
         }
       }
     }
   }
   ```
3. Click **"Publish"**

### Security Note:
These rules allow public access for simplicity. For production:
- Enable Firebase Authentication
- Restrict write access to authenticated users
- See [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)

---

## Step 7: (Optional) Enable Firebase Authentication

If you want to add user authentication later:

1. In Firebase Console, click **"Build"** > **"Authentication"**
2. Click **"Get started"**
3. Enable sign-in methods:
   - Click **"Email/Password"**
   - Toggle **"Enable"**
   - Click **"Save"**

---

## Step 8: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Open http://localhost:3000 in your browser
3. You should see the landing page without errors
4. Click **"Add Attendance"**
5. Fill in the form and submit
6. Check Firebase Console > Firestore Database to see the new data

---

## Step 9: Verify Data Structure

After adding test data, your Firestore should look like this:

```
📁 services (collection)
  📄 auto-generated-id-1
    serviceDate: February 4, 2026 at 12:00:00 AM UTC
    serviceType: "Saturday Fellowship"
    totalAttendance: 150
    createdAt: February 4, 2026 at 2:30:00 PM UTC
    updatedAt: February 4, 2026 at 2:30:00 PM UTC
    
    📁 visitors (sub-collection)
      📄 auto-generated-id-1
        visitorName: "John Doe"
        visitorContact: "john@example.com"
        visitDate: February 4, 2026 at 12:00:00 AM UTC
        createdAt: February 4, 2026 at 2:35:00 PM UTC
```

---

## Troubleshooting

### Error: "Firebase: Error (auth/configuration-not-found)"
- **Solution**: Make sure all environment variables in `.env.local` are set correctly
- Restart your development server after changing `.env.local`

### Error: "Missing or insufficient permissions"
- **Solution**: Check Firestore Security Rules
- Make sure rules are published
- Verify your rules allow the operations you're trying to perform

### Data Not Showing Up
- **Solution**: 
  - Check Firebase Console > Firestore Database
  - Verify documents are being created
  - Check browser console for errors
  - Ensure dates are valid

### Environment Variables Not Loading
- **Solution**:
  - Restart dev server: `Ctrl+C` then `npm run dev`
  - Check file is named `.env.local` (not `.env.local.txt`)
  - Variables must start with `NEXT_PUBLIC_`

---

## Firebase Console Quick Links

- **Firestore Database**: View and manage data
- **Authentication**: Manage users (if enabled)
- **Usage**: Monitor usage and quotas
- **Project Settings**: Get config and manage project

---

## Free Tier Limits

Firebase Spark (Free) Plan includes:
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Authentication**: Unlimited users
- **Hosting**: 10 GB storage, 360 MB/day bandwidth

This is more than enough for most church attendance systems.

---

## Upgrading to Production

When ready for production:

1. **Add Authentication**:
   - Enable Firebase Auth
   - Update security rules to require authentication
   
2. **Backup Strategy**:
   - Enable automated backups in Firebase Console
   - Export data regularly
   
3. **Upgrade Plan** (if needed):
   - Upgrade to Blaze (Pay as you go) plan
   - Monitor usage in Firebase Console

4. **Custom Domain**:
   - Purchase a domain
   - Set up Firebase Hosting
   - Configure custom domain

---

## Next Steps

✅ Firebase is now set up!

You can now:
1. Add attendance records
2. Track visitors
3. View analytics
4. Customize the application

For database structure details, see [FIRESTORE_STRUCTURE.md](FIRESTORE_STRUCTURE.md)

---

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase YouTube Channel](https://www.youtube.com/user/Firebase)

---

**Need Help?** Contact the Christhood Ministry tech team.
