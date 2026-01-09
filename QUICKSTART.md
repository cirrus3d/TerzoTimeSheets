# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works fine)

## Step-by-Step Setup

### 1. Install Dependencies
Already done! Dependencies are installed.

### 2. Set Up Supabase

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Click "New project"
   - Choose an organization and fill in project details
   - Wait for the project to be provisioned (1-2 minutes)

2. **Run Database Schema**
   - In your Supabase dashboard, go to SQL Editor
   - Copy the SQL from `DATABASE_SCHEMA.md`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Get API Credentials**
   - Go to Project Settings > API
   - Copy your Project URL
   - Copy your `anon` public key

### 3. Configure Environment Variables

1. Create a `.env.local` file in the project root:
   ```bash
   copy .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Create Admin User

1. In Supabase dashboard, go to Authentication > Users
2. Click "Add user" > "Create new user"
3. Enter:
   - Email: `admin@example.com` (or your preferred email)
   - Password: Create a strong password
4. Click "Create user"

### 5. Start the Development Server

```bash
npm run dev
```

Visit http://localhost:3000 and log in with your admin credentials!

## What You Can Do

1. **Login** - Use your admin credentials
2. **Manage Stores** - Click "Manage" to add/edit/delete stores
3. **Manage Employees** - In the Manage section, add employees to stores
4. **Daily Timesheet** - Main dashboard shows today's timesheet:
   - Add entries with clock-in/out times (15-min intervals)
   - Navigate between days
   - View calculated hours
   - Edit/delete entries

## Troubleshooting

### "Invalid login credentials"
- Check your email/password
- Verify the user exists in Supabase Auth

### "Failed to fetch"
- Check your `.env.local` file has correct Supabase credentials
- Verify your Supabase project is running
- Check your internet connection

### Database errors
- Make sure you ran all SQL commands from `DATABASE_SCHEMA.md`
- Check Row Level Security policies are created

## Production Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

### Other Platforms
- Set environment variables
- Run `npm run build`
- Run `npm start`

## Support
Check the README.md for more detailed information.
