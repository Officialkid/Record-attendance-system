# Insight Tracker Attendance System - User Guide

## Quick Start

### 1. First-Time Setup

Before using the application, you need to set up your Supabase database:

1. **Create a Supabase Account**
   - Visit https://supabase.com and sign up
   - Create a new project

2. **Setup Database**
   - In Supabase dashboard, go to SQL Editor
   - Open the `supabase-schema.sql` file in your project
   - Copy and paste the SQL code into the SQL Editor
   - Click "Run" to create the tables

3. **Get API Credentials**
   - Go to Project Settings > API in Supabase
   - Copy your "Project URL" and "anon public" key
   - Open `.env.local` in your project
   - Replace the placeholder values:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

4. **Start the Application**
   ```bash
   npm install
   npm run dev
   ```
   - Open http://localhost:3000 in your browser

---

## Using the Application

### Home Page
The home page displays three main sections:
- **Add Attendance** - Record new service attendance
- **View Analytics** - See attendance statistics and trends
- **Manage Visitors** - (Coming soon) Track visitor follow-ups

---

### Adding Attendance

1. **Navigate to Add Attendance**
   - Click the "Add Attendance" card on the home page

2. **Fill in Service Information**
   - **Service Date**: Select the date of the service
   - **Service Type**: Choose from:
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
- **Total Services**: Number of services recorded
- **Average Attendance**: Mean attendance across all services
- **Total Visitors**: Number of unique visitors tracked
- **Growth Rate**: Percentage change in attendance (last month vs. previous month)

#### Recent Services Table
Displays the 10 most recent services with:
- Service date
- Service type
- Attendance count
- Number of visitors for that service

#### Recent Visitors Table
Shows the 10 most recent visitors with:
- Visitor name
- Contact information
- Visit date

---

## Understanding the Data

### Services
Each service record includes:
- Date of the service
- Type of service
- Total attendance count
- Associated visitors (optional)

### Visitors
Each visitor record includes:
- Name (optional)
- Contact information (optional)
- Date of visit
- Linked to a specific service

### Analytics Calculations

**Average Attendance**
- Sum of all attendance counts ÷ Number of services

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

2. **Consistent Service Types**
   - Use the same service type names for consistency
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
- Verify your `.env.local` has correct Supabase credentials
- Ensure the database schema was created correctly

### "Failed to load analytics data"
- Check internet connection
- Verify Supabase project is active
- Check browser console for specific errors

### Data not showing
- Refresh the page
- Verify data was saved (check Supabase dashboard)
- Clear browser cache

---

## Database Management

### Viewing Data in Supabase
1. Go to your Supabase project dashboard
2. Click "Table Editor"
3. Select "services" or "visitors" table
4. View, edit, or delete records directly

### Backing Up Data
1. In Supabase, go to Table Editor
2. Select a table
3. Click "..." menu > Export as CSV
4. Save backup file regularly

### Deleting Records
- Records can be deleted from Supabase Table Editor
- Deleting a service will automatically delete associated visitors (cascade delete)

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
