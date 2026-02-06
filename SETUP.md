# Christhood Ministry Attendance Management System - Setup Instructions

## Database Setup (Supabase)

1. **Create a Supabase account** at https://supabase.com if you don't have one

2. **Create a new project** in Supabase

3. **Run the database schema**:
   - Go to the SQL Editor in your Supabase project
   - Copy the contents of `supabase-schema.sql`
   - Execute the SQL to create the tables

4. **Get your Supabase credentials**:
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key
   - Add them to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

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
- ✅ Christhood Ministry branding

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
  /add-attendance     - Form to add new attendance records
  /view-analytics     - Analytics dashboard
  /layout.tsx         - Root layout
  /page.tsx           - Home page
  /globals.css        - Global styles
/components
  /ui                 - Reusable UI components
/lib
  /supabase.ts        - Supabase client configuration
  /utils.ts           - Utility functions
/types
  /index.ts           - TypeScript types
```

## Color Scheme

The application uses Christhood Ministry's brand colors:
- Royal Purple: #4b248c
- Primary Blue: #0047AB
- Gold: #F3CC3C
- Background: #f9f9f9

## Technologies

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Supabase
- Lucide React (icons)
- Framer Motion (animations)
- date-fns (date formatting)

## Support

For issues or questions, contact the Christhood Ministry tech team.
