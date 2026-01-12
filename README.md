# TerzoTimeSheets

A modern Next.js application for managing employee timesheets for cafe-bars. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication**: Secure login for administrators
- **Store Management**: Create, edit, and delete stores
- **Employee Management**: Manage employees per store with hiring and firing dates
- **Daily Timesheet**: 
  - View timesheets by date with calendar picker navigation
  - Add, edit, and delete timesheet entries
  - Clock-in and clock-out times with 15-minute intervals
  - Automatic hours calculation
  - Mobile-responsive popup modals for easy data entry
  - Store filtering via dropdown
- **Reports**:
  - Weekly reports with daily breakdown and totals
  - Monthly reports with aggregate statistics
  - Store-filtered views
  - Date navigation for historical data
- **Access Control**: 
  - Store-based access control for users
  - Users can only view/manage assigned stores
  - Enforced at database level via RLS policies
- **Employee Lifecycle**: Track hiring and firing dates for accurate historical reporting
- **Cascading Deletes**: Deleting a store automatically removes all associated employees and their timesheet entries

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Date Handling**: date-fns

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Navigate to the SQL Editor in your Supabase dashboard
4. **Option A** - Fresh installation: Run all commands from `setup.sql`
5. **Option B** - Upgrade existing installation: Run `migration_access_control.sql`
6. The database tables, indexes, and RLS policies will be created automatically

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to Project Settings > API in your Supabase dashboard
   - Copy the Project URL and anon/public key

3. Update `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 4. Create an Admin User

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user" > "Create new user"
3. Enter an email and password for the admin account
4. Click "Create user"
5. **Important**: Assign the user to stores they should manage:
   - Go to SQL Editor
   - Run: `INSERT INTO user_stores (user_id, store_id) VALUES ('user-uuid', 'store-uuid');`
   - See `USER_STORE_MANAGEMENT.md` for detailed instructions

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Login
- Use the admin credentials you created in Supabase to log in

### Managing Stores
- Navigate to the "Manage" section from the dashboard
- Add, edit, or delete stores
- **New stores are automatically assigned to the creator**
- Note: Deleting a store will remove all associated employees

### Managing Employees
- In the "Manage" section, add employees with:
  - First name and last name
  - Assigned store
  - Hiring date (when they started)
  - Firing date (optional, when they were terminated)
- Employees only appear in timesheets during their employment period
- Edit or delete employees as needed

### Daily Timesheet
- Select a store from the dropdown in the header
- The main dashboard shows the timesheet for the current day
- Use calendar picker or "Previous/Next" buttons to navigate between days
- Click "Today" to quickly return to the current date
- Click "Add Entry" to add a new timesheet entry:
  - Select an employee (only active employees shown for the selected date)
  - Choose clock-in time (15-minute intervals)
  - Choose clock-out time (15-minute intervals)
  - Hours are calculated automatically
- Edit or delete entries as needed
- View the total hours for the day at the bottom

### Reports
- Click "Reports" in the header to access reporting
- Toggle between Weekly and Monthly views
- **Weekly Report**: Shows hours per employee per day with totals
- **Monthly Report**: Shows total hours, days worked, and averages
- Use navigation buttons to view historical data
- Reports are filtered by selected store

### Access Control
- Users can only view and manage stores they are assigned to
- Contact your administrator to gain access to additional stores
- See `USER_STORE_MANAGEMENT.md` for admin instructions

## Database Schema

See `DATABASE_SCHEMA.md` for the complete database schema including:
- Tables: stores, employees, timesheet_entries, user_stores
- Indexes for optimized queries
- Row Level Security (RLS) policies for store-based access control
- Migration scripts for upgrading existing installations

For detailed information on managing user access to stores, see `USER_STORE_MANAGEMENT.md`.

## Project Structure

```
TerzoTimeSheets/
├── app/                      # Next.js App Router pages
│   ├── dashboard/           # Main timesheet dashboard
│   ├── management/          # Store and employee management
│   ├── reports/             # Weekly and monthly reports
│   ├── layout.tsx           # Root layout
│   ├── page.tsx            # Login page
│   └── globals.css         # Global styles
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── management/         # Store and employee management
│   ├── timesheet/          # Timesheet components
│   ├── reports/            # Report components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utility functions
│   ├── supabase/           # Supabase client configuration
│   └── utils/              # Helper functions (date, time)
├── types/                  # TypeScript type definitions
├── DATABASE_SCHEMA.md      # Complete database schema
├── USER_STORE_MANAGEMENT.md # User access control guide
├── setup.sql               # Fresh installation script
├── migration_access_control.sql # Upgrade script
└── ACCESS_CONTROL_SUMMARY.md # Implementation summary
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Mobile Optimization

The application is fully responsive and optimized for mobile devices:
- Touch-friendly buttons and controls
- Modal popups for easy data entry on small screens
- Responsive tables with horizontal scrolling when needed
- Large tap targets for better mobile usability

## Security

- Authentication is handled by Supabase Auth
- Row Level Security (RLS) policies ensure data access control
- All database operations require authentication
- Environment variables keep sensitive data secure

## License

MIT

## Support

For issues or questions, please create an issue in the GitHub repository.
