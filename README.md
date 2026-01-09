# TerzoTimeSheets

A modern Next.js application for managing employee timesheets for cafe-bars. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication**: Secure login for administrators
- **Store Management**: Create, edit, and delete stores
- **Employee Management**: Manage employees per store with first name and last name
- **Daily Timesheet**: 
  - View timesheets by date with navigation (previous/next day)
  - Add, edit, and delete timesheet entries
  - Clock-in and clock-out times with 15-minute intervals
  - Automatic hours calculation
  - Mobile-responsive popup modals for easy data entry
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
4. Run the SQL commands from `DATABASE_SCHEMA.md` to create the tables, indexes, and RLS policies

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
- Note: Deleting a store will remove all associated employees

### Managing Employees
- In the "Manage" section, add employees with their first name, last name, and assigned store
- Edit or delete employees as needed

### Daily Timesheet
- The main dashboard shows the timesheet for the current day
- Use "Previous" and "Next" buttons to navigate between days
- Click "Today" to quickly return to the current date
- Click "Add Entry" to add a new timesheet entry:
  - Select an employee
  - Choose clock-in time (15-minute intervals)
  - Choose clock-out time (15-minute intervals)
  - Hours are calculated automatically
- Edit or delete entries as needed
- View the total hours for the day at the bottom

## Database Schema

See `DATABASE_SCHEMA.md` for the complete database schema including:
- Tables: stores, employees, timesheet_entries
- Indexes for optimized queries
- Row Level Security (RLS) policies

## Project Structure

```
TerzoTimeSheets/
├── app/                      # Next.js App Router pages
│   ├── dashboard/           # Main timesheet dashboard
│   ├── management/          # Store and employee management
│   ├── layout.tsx           # Root layout
│   ├── page.tsx            # Login page
│   └── globals.css         # Global styles
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── management/         # Store and employee management
│   ├── timesheet/          # Timesheet components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utility functions
│   ├── supabase/           # Supabase client configuration
│   └── utils/              # Helper functions (date, time)
└── types/                  # TypeScript type definitions
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
