# Insight Tracker - Attendance Management System

A modern attendance management system built with Next.js 14, TypeScript, Tailwind CSS, and Firebase Firestore.

## Features

- � **Multi-tenant Authentication** - Firebase Auth with organization management
- 📊 **Real-time Attendance Tracking** - Firestore real-time updates
- 👥 **Visitor Management** - Track guests with follow-up information
- 📈 **Analytics Dashboard** - Visual insights and growth metrics
- 🎯 **Dynamic Terminology** - Adapts labels based on organization type (Church → "Services", Corporate → "Events")
- 🏢 **Organization Management** - Multi-organization support with role-based access
- 📱 **Fully Responsive** - Mobile-first design with progressive web app capabilities
- 🎨 **Custom Branding** - Insight Tracker color scheme and animations
- 🔍 **Audit Logging** - Track all changes for accountability
- 📤 **Data Export** - Export visitor and attendance data to CSV

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **UI Components:** Lucide React icons
- **Animations:** Framer Motion
- **Date Handling:** date-fns

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A Firebase account (free tier works fine)
- Git installed

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Record-attendance-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project"
   - Follow the setup wizard
   - Enable Firestore Database (choose production or test mode)
   - Enable Authentication > Email/Password sign-in method
   - (Optional) Enable Storage for profile pictures

4. **Get Firebase Configuration**
   - In Firebase Console, go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click the web icon (</>)
   - Copy your Firebase configuration

5. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

6. **Deploy Firestore Security Rules**
   - Go to Firebase Console > Firestore Database > Rules
   - Copy contents from `firestore.rules` in this project
   - Paste and publish the rules

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

9. **Create your first account**
   - Click "Sign Up"
   - Fill in organization details
   - Start tracking attendance!

For detailed setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

## Firebase Firestore Structure

This is a **multi-tenant** application with organization-based data isolation.

### Main Collections

#### `organizations`
- Organization profiles
- Owner and member lists
- Settings (currency, timezone)

#### `users`
- User profiles
- Email, name, profile picture
- Organization memberships

#### `services` (Events/Services)
- Event records with attendance data
- Scoped by `organizationId`
- Fields: `eventType`, `serviceDate`, `totalAttendance`, `organizationId`

#### `services/{serviceId}/visitors` (Sub-collection)
- Visitor records for each event
- Fields: `visitorName`, `visitorContact`, `visitDate`

#### `audit_logs`
- Track all edit/delete operations
- Fields: `orgId`, `actorId`, `action`, `serviceId`, `before`, `after`

#### `organization_invites`
- Pending member invitations
- Fields: `orgId`, `email`, `role`, `status`, `invitedBy`

See [FIRESTORE_STRUCTURE.md](FIRESTORE_STRUCTURE.md) for complete documentation.

## Project Structure

```
/app
  /(auth)                      - Authentication pages
    /sign-in                   - Login page
    /sign-up                   - Registration page
    /forgot-password           - Password reset
  /(dashboard)                 - Protected dashboard routes
    /dashboard                 - Main dashboard
    /add-attendance            - Record attendance
    /view-analytics            - Analytics & reports
    /visitors                  - Visitor directory
    /settings                  - Organization settings
  /page.tsx                    - Landing page
  /layout.tsx                  - Root layout
  /globals.css                 - Global styles + CSS variables

/components
  /ui                          - Reusable UI components (Button, Card, Input)
  /charts                      - Chart components (MonthlyAttendance, YearOverYear)
  /dashboard                   - Dashboard-specific components
  /modals                      - Modal components (EditEvent, DeleteConfirm)
  /analytics                   - Analytics tab components
  Navigation.tsx               - Main navigation
  ProtectedRoute.tsx           - Route protection HOC

/lib
  /firebase.ts                 - Firebase initialization
  /firestore-multitenant.ts    - Multi-tenant Firestore operations
  /terminology.ts              - Dynamic terminology helper
  /AuthContext.tsx             - Authentication context provider
  /OrganizationContext.tsx     - Organization context provider
  /utils.ts                    - Utility functions

/types
  /index.ts                    - TypeScript type definitions

/public                        - Static assets

firestore.rules                - Firestore security rules
```

## Color Scheme

- Text Color: #ffffff
- Black Color: #000000
- Royal Purple: #4b248c
- Primary Blue: #0047AB
- Gold Color: #F3CC3C
- Background: #f9f9f9
- Nav Background: rgba(255, 255, 255, 0.98)

## Key Features Explained

### Multi-Tenant Architecture
Each organization has isolated data. Users can belong to multiple organizations and switch between them.

### Dynamic Terminology
- Churches/Ministries see: "Services", "Visitors", "Attendees"
- Other organizations see: "Events", "Guests", "Participants"

### Security
- Row-level security via Firestore rules
- Authentication required for all operations
- Organization membership verified on every request
- Audit logs track all modifications

### Real-time Updates
- Firestore subscriptions for live data
- Instant UI updates when data changes
- Optimistic updates for better UX

## Documentation

- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Detailed Firebase setup guide
- [FIRESTORE_STRUCTURE.md](FIRESTORE_STRUCTURE.md) - Complete database schema
- [USER_GUIDE.md](USER_GUIDE.md) - End-user documentation
- [SETUP.md](SETUP.md) - Quick setup guide

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Technology Stack Details

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Auth** - User authentication
- **Firebase Storage** - File storage for profile pictures
- **Framer Motion** - Animation library
- **Recharts** - Chart library for analytics
- **date-fns** - Date utility library
- **react-hot-toast** - Toast notifications
- **Lucide React** - Icon library

## Contributing

This is a private project for Insight Tracker. Contact the team for contribution guidelines.

## Support

For issues, questions, or feature requests, contact the Insight Tracker development team.

## License

Private - Insight Tracker  
All rights reserved.
