# Admin Role Setup Guide for Stellamaris E-commerce

## Overview
This guide explains how to set up admin roles using Clerk metadata to distinguish between regular users and admin users. Admin users can respond to reviews and access the admin dashboard.

## Setting Up Admin Roles via Clerk Metadata

### 1. Access Clerk Dashboard
1. Go to your Clerk dashboard at [dashboard.clerk.dev](https://dashboard.clerk.dev)
2. Select your Stellamaris project
3. Navigate to "Users" in the sidebar

### 2. Assign Admin Role to a User

#### Method 1: Via Clerk Dashboard (Recommended for initial setup)
1. **Find the user** you want to make an admin in the Users list
2. **Click on the user** to open their profile
3. **Go to the "Metadata" tab**
4. **Add Public Metadata:**
   ```json
   {
     "role": "admin"
   }
   ```
5. **Save the changes**

#### Method 2: Programmatically (For bulk operations)
You can also set metadata programmatically using Clerk's API:

```javascript
// Example using Clerk's Backend API
import { clerkClient } from '@clerk/clerk-sdk-node'

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: 'admin'
  }
})
```

### 3. Understanding Metadata Types

**Public Metadata** (Used for roles):
- Accessible on the frontend
- Included in JWT tokens
- Perfect for role-based access control
- Example: `{ "role": "admin" }`

**Private Metadata** (For sensitive data):
- Only accessible on the backend
- Not included in JWT tokens
- Use for internal admin notes, etc.

### 4. Role Values

The system recognizes these role values:
- `"admin"` - Full admin access
- `"customer"` or `undefined` - Regular customer access

## Features Available to Admin Users

### 1. Admin Dashboard Access
- URL: `/admin`
- Protected route requiring authentication and admin role
- Access denied page shown to non-admin users

### 2. Admin Navigation Link
- Appears in both desktop and mobile navigation
- Only visible to users with admin role
- Orange colored with shield icon for easy identification

### 3. Review Management
- **Respond to Reviews**: Admin can reply to customer reviews
- **Remove Admin Responses**: Admin can delete their own responses
- **Admin responses show**: "Response from Stellamaris"
- **Admin name appears**: In reply form as "Reply as Admin ({Admin Name})"

## Testing Admin Functionality

### 1. Create Test Admin User
1. Sign up with a test account
2. In Clerk dashboard, set the user's public metadata:
   ```json
   { "role": "admin" }
   ```
3. Sign out and sign back in to refresh the session

### 2. Verify Admin Features
1. **Navigation**: Admin link should appear in header
2. **Admin Dashboard**: Should be accessible at `/admin`
3. **Review Responses**: Should see "Reply as Admin" option on reviews
4. **Protection**: Non-admin users should see "Access Denied" for `/admin`

## Security Considerations

### 1. Metadata Security
- Public metadata is visible to the frontend
- Never store sensitive information in public metadata
- Role assignments should be carefully managed

### 2. Backend Validation
- All admin functions validate user role on the backend
- Clerk user ID is used to verify admin status
- No frontend-only role checking for sensitive operations

### 3. Production Recommendations
- Limit number of admin users
- Regularly audit admin role assignments
- Consider implementing admin activity logging
- Use environment-specific role assignments

## Troubleshooting

### Admin Link Not Appearing
1. **Check metadata**: Ensure `role: "admin"` is set in public metadata
2. **Refresh session**: Sign out and sign in again
3. **Clear cache**: Clear browser cache and cookies
4. **Check spelling**: Ensure role value is exactly `"admin"`

### Access Denied on Admin Routes
1. **Verify authentication**: Ensure user is signed in
2. **Check role**: Confirm admin role in Clerk dashboard
3. **Session refresh**: Try signing out and back in
4. **Network issues**: Check console for authentication errors

### Admin Review Functions Not Working
1. **Backend permissions**: Verify user has admin role in Convex database
2. **Sync issues**: Check if user record is properly synced from Clerk
3. **Console errors**: Check browser console for API errors

## Additional Admin Features (Future Enhancements)

Potential future admin features could include:
- User management from admin dashboard
- Product management interface
- Order management and fulfillment
- Analytics and reporting
- Bulk operations on reviews
- Advanced permission levels (super admin, moderator, etc.)

## Support

If you encounter issues with admin role setup:
1. Check this guide for common solutions
2. Verify Clerk configuration
3. Test with a fresh user account
4. Check browser console for errors

---

**Security Note**: Always verify admin permissions on the backend. Frontend role checking is for UX only - never rely on it for security. 