# Insight Tracker - Attendance Management System

A modern attendance management system built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 📊 Real-time attendance tracking
- 👥 Visitor management
- 📈 Analytics and insights
- 🎨 Custom color scheme matching Insight Tracker branding
- 📱 Responsive design

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

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Structure

### Services Collection
Path: `services/{serviceId}`
- `serviceDate` (timestamp)
- `serviceType` (string, default: 'Saturday Fellowship')
- `totalAttendance` (number)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Visitors Sub-collection
Path: `services/{serviceId}/visitors/{visitorId}`
- `visitorName` (string, optional)
- `visitorContact` (string, optional)
- `visitDate` (timestamp)
- `createdAt` (timestamp)

See [FIRESTORE_STRUCTURE.md](FIRESTORE_STRUCTURE.md) for detailed database documentation.

## Project Structure

```
/app
  /(dashboard)
    /add-attendance
    /view-analytics
  /api
  /layout.tsx
  /page.tsx
/components
  /ui
  /charts
/lib
  /firebase.ts
  /firestore.ts
  /utils.ts
/types
  /index.ts
```

## Color Scheme

- Text Color: #ffffff
- Black Color: #000000
- Royal Purple: #4b248c
- Primary Blue: #0047AB
- Gold Color: #F3CC3C
- Background: #f9f9f9
- Nav Background: rgba(255, 255, 255, 0.98)

## License

Private - Insight Tracker
