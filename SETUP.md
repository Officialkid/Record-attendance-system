# Insight Tracker Attendance Management System - Setup Instructions

## Database Setup (Firebase)

1. **Create a Firebase account** at https://console.firebase.google.com if you don't have one

2. **Create a new Firebase project**

3. **Enable Firestore Database**:
   - In your Firebase project, go to Build > Firestore Database
   - Click "Create database"
   - Choose "Start in production mode" or "Test mode" (for development)
   - Select your region

4. **Enable Firebase Authentication**:
   - Go to Build > Authentication
   - Click "Get started"
   - Enable Email/Password sign-in method

5. **Get your Firebase credentials**:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" and click the web icon (</>
   - Register your app and copy the config
   - Add credentials to `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

6. **Setup Firestore Rules**:
   - Copy the contents of `firestore.rules`
   - Go to Firestore Database > Rules
   - Paste and publish the rules

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- ✅ Add attendance records for services
- ✅ Track visitor information
- ✅ View analytics and statistics
- ✅ Responsive design
- ✅ Insight Tracker branding

## Usage

### Adding Attendance
1. Navigate to "Add Attendance"
2. Select service date and type
3. Enter total attendance count
4. Add visitor information (optional)
5. Save the record

### Viewing Analytics
1. Navigate to "View Analytics"
2. See statistics: total services, average attendance, growth rate
3. View recent services and visitors

## Project Structure

```
/app
  /(dashboard)
    /add-attendance     - Form to add new attendance records
    /view-analytics     - Analytics dashboard
    /dashboard          - Main dashboard
    /visitors           - Visitors directory
  /(auth)
    /sign-in            - Sign in page
    /sign-up            - Sign up page
  /layout.tsx           - Root layout
  /page.tsx             - Landing page
  /globals.css          - Global styles
/components
  /ui                   - Reusable UI components
  /charts               - Chart components
  /modals               - Modal components
  /dashboard            - Dashboard components
/lib
  /firebase.ts          - Firebase client configuration
  /firestore-multitenant.ts - Firestore operations (multi-tenant)
  /terminology.ts       - Dynamic terminology helper
  /AuthContext.tsx      - Authentication context
  /OrganizationContext.tsx - Organization context
/types
  /index.ts             - TypeScript types
```

## Color Scheme

The application uses Insight Tracker's brand colors:
- Royal Purple: #4b248c
- Primary Blue: #0047AB
- Gold: #F3CC3C
- Background: #f9f9f9

## Technologies

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Firebase Firestore (Database)
- Firebase Authentication
- Firebase Storage
- Lucide React (icons)
- Framer Motion (animations)
- date-fns (date formatting)
- recharts (charts)

## Support

For issues or questions, contact the Insight Tracker team.
