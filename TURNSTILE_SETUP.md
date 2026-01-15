# Cloudflare Turnstile Setup Guide

## Overview
Cloudflare Turnstile has been integrated into the TerzoTimeSheets login system to protect against bots and automated attacks.

## Configuration Steps

### 1. Get Turnstile Keys from Cloudflare

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile** section
3. Click **Add Site**
4. Configure your site:
   - **Site Name**: TerzoTimeSheets (or your preference)
   - **Domain**: Your application domain (e.g., `localhost` for development)
   - **Widget Mode**: Choose **Managed** (recommended) or **Non-Interactive**
5. Click **Create**
6. Copy the **Site Key** and **Secret Key**

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
```

Replace `your-turnstile-site-key` and `your-turnstile-secret-key` with the keys from step 1.

### 3. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. You should see the Turnstile widget above the Sign In button
4. Complete the challenge and test the login

## How It Works

1. **Client-Side**: The Turnstile widget renders on the login form and challenges the user
2. **Token Generation**: Upon successful completion, Turnstile generates a token
3. **Server Verification**: Before allowing login, the server verifies the token with Cloudflare
4. **Login Proceeds**: Only if Turnstile verification passes does the login attempt proceed

## Features

- ✅ Bot protection on login
- ✅ Automatic token reset on failed login attempts
- ✅ Token expiration handling
- ✅ User-friendly error messages
- ✅ Disabled submit button until Turnstile completes

## Testing in Development

For local development, use `localhost` as your domain in Turnstile configuration. Cloudflare allows this for testing purposes.

## Production Deployment

When deploying to production:
1. Add your production domain to Turnstile site configuration
2. Update environment variables in your hosting platform
3. Test the login flow thoroughly

## Troubleshooting

**Widget not appearing:**
- Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set correctly
- Check browser console for errors

**Verification failing:**
- Ensure `TURNSTILE_SECRET_KEY` is set on the server
- Check that the domain matches your Turnstile configuration
- Review logs at `/api/auth/verify-turnstile` for error details

**Token expiring:**
- Turnstile tokens expire after a few minutes
- The widget automatically resets on expiration
- Users need to complete the challenge again

## Security Notes

- Never expose `TURNSTILE_SECRET_KEY` in client-side code
- The secret key is only used server-side for verification
- Site key is public and safe to include in client code (prefixed with `NEXT_PUBLIC_`)
