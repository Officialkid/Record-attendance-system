# Insight Tracker Attendance System - User Guide

## Quick Start

### 1. First-Time Setup

Before using the application, you need to set up your Firebase project:

1. **Create a Firebase Account**
   - Visit https://console.firebase.google.com and sign up
   - Create a new project

2. **Enable Firestore Database**
   - In Firebase Console, go to Build > Firestore Database
   - Click "Create database"
   - Choose production mode or test mode (test mode for development)
   - Select your region

3. **Enable Firebase Authentication**
   - Go to Build > Authentication
   - Click "Get started"
   - Enable "Email/Password" sign-in method

4. **Setup Firestore Security Rules**
   - Go to Firestore Database > Rules
   - Copy contents from `firestore.rules` file in your project
   - Paste and publish the rules

5. **Get Firebase Credentials**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click the web icon (</>)
   - Register your app and copy the config
   - Open `.env.local` in your project
   - Add your credentials:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

6. **Start the Application**
   ```bash
   npm install
   npm run dev
   ```
   - Open http://localhost:3000 in your browser

---

## Using the Application

### Home Page
The home page displays three main sections:
- **Add Attendance** - Record new event attendance
- **View Analytics** - See attendance statistics and trends
- **Manage Visitors** - (Coming soon) Track visitor follow-ups

---

### Adding Attendance

1. **Navigate to Add Attendance**
   - Click the "Add Attendance" card on the home page

2. **Fill in Event Information**
   - **Event Date**: Select the date of the event
   - **Event Type**: Choose from:
     - Saturday Fellowship (default)
     - Sunday Service
     - Midweek Service
     - Special Event
   - **Total Attendance**: Enter the total number of people present

3. **Add Visitors (Optional)**
   - Click "+ Add Visitor" button
   - Enter visitor name
   - Enter contact information (phone or email)
   - Add multiple visitors by clicking "+ Add Visitor" again
   - Remove a visitor by clicking the trash icon

4. **Save Record**
   - Click "Save Attendance" button
   - You'll be redirected to the Analytics page

---

### Viewing Analytics

The Analytics page shows:

#### Statistics Cards
- **Total Events**: Number of events recorded
- **Average Attendance**: Mean attendance across all events
- **Total Visitors**: Number of unique visitors tracked
- **Growth Rate**: Percentage change in attendance (last month vs. previous month)

#### Recent Events Table
Displays the 10 most recent events with:
- Event date
- Event type
- Attendance count
- Number of visitors for that event

#### Recent Visitors Table
Shows the 10 most recent visitors with:
- Visitor name
- Contact information
- Visit date

---

## Understanding the Data

### Events
Each event record includes:
- Date of the event
- Type of event
- Total attendance count
- Associated visitors (optional)

### Visitors
Each visitor record includes:
- Name (optional)
- Contact information (optional)
- Date of visit
- Linked to a specific event

### Analytics Calculations

**Average Attendance**
- Sum of all attendance counts ÷ Number of events

**Growth Rate**
- Compares average attendance from last month to previous month
- Formula: ((Last Month - Previous Month) / Previous Month) × 100
- Green (+) indicates growth
- Red (-) indicates decline

---

## Tips for Best Results

1. **Record Attendance Promptly**
   - Add attendance data on the same day or soon after
   - This ensures accurate analytics

2. **Consistent Event Types**
   - Use the same event type names for consistency
   - This helps with trend analysis

3. **Visitor Information**
   - Collect visitor contact info for follow-up
   - Name and contact fields are optional but recommended

4. **Regular Reviews**
   - Check analytics weekly or monthly
   - Monitor growth trends
   - Use data to inform ministry decisions

---

## Troubleshooting

### "Failed to save attendance"
- Check your internet connection
- Verify your `.env.local` has correct Firebase credentials
- Ensure Firestore rules are properly configured
- Check Firebase Console for any service issues

### "Failed to load analytics data"
- Check internet connection
- Verify Firebase project is active
- Check browser console for specific errors
- Ensure Firestore indexes are created (check Firebase Console)

### Data not showing
- Refresh the page
- Verify data was saved (check Firebase Console > Firestore Database)
- Clear browser cache

---

## Database Management

### Viewing Data in Firebase
1. Go to Firebase Console (https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database
4. Browse collections: `organizations`, `services`, `users`, `audit_logs`
5. Click on documents to view details and sub-collections
6. View visitor data in `services/{serviceId}/visitors`

### Backing Up Data
1. In Firebase Console, go to Firestore Database
2. Click on the three dots menu > Export
3. Choose your backup location (Cloud Storage bucket)
4. For manual exports, use the Export CSV feature in the app (Visitors page)

### Deleting Records
- Use the Edit/Delete buttons in the Analytics page
- Records can be deleted from Firebase Console > Firestore Database
- Deleting an event will automatically delete associated visitors (sub-collection)
- All deletions are logged in the `audit_logs` collection

---

## Contact & Support

For technical issues or feature requests, contact the Insight Tracker team.

---

## Future Enhancements

Planned features:
- Visitor follow-up tracking
- Email notifications
- Export reports to PDF
- Advanced analytics charts
- Multi-location support
- Member vs. visitor differentiation
