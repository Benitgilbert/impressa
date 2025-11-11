# Report Generation Troubleshooting Guide

## Common Causes of "Failed to generate report" Error

### 1. Missing Required Parameters

Different report types require different parameters:

- **Monthly Report**: `month` and `year` (auto-filled if missing)
- **Daily Report**: `date` (auto-filled if missing)
- **Custom Range**: `start` and `end` dates (REQUIRED)
- **Customer Report**: `customerId` (REQUIRED)
- **Status Report**: `status` (REQUIRED)
- **Revenue Report**: `start` and `end` dates (REQUIRED)

### 2. Database Connection Issues

- Ensure MongoDB is running
- Check database connection string in `.env`
- Verify database has orders collection with data

### 3. Invalid Report Type

Valid report types are:
- `monthly`
- `daily`
- `custom-range`
- `customer`
- `status`
- `revenue`

### 4. Authentication Issues

- Ensure you're logged in as an admin user
- Check that auth token is valid
- Verify admin role in database

## Recent Fixes Applied

1. **Added input validation** for all report types
2. **Improved error messages** to show specific issues
3. **Added logo file checking** to prevent crashes if logo missing
4. **Enhanced error handling** in buildReportData function
5. **Better frontend error display** showing actual error messages

## How to Debug

### Backend Logs

Check the backend console for detailed error messages. The error will now show:
- The specific parameter that's missing
- Database query errors
- Stack traces (in development mode)

### Frontend Error Messages

The error message displayed will now include the actual error from the backend instead of just "Failed to generate report".

### Test Each Report Type

1. **Monthly Report**: Should work without any date inputs
2. **Daily Report**: Should work without any date inputs  
3. **Custom Range**: Requires both "From" and "To" dates
4. **Revenue**: Requires both "From" and "To" dates
5. **Customer**: Requires customer ID in URL parameter
6. **Status**: Requires status parameter in URL parameter

## Quick Fix Steps

1. **Restart the backend server** to apply the fixes:
   ```powershell
   cd impressa\impressa-backend
   npm run dev
   ```

2. **Clear browser cache** and refresh the frontend

3. **Try generating a Monthly or Daily report first** - these have the fewest requirements

4. **Check browser console** (F12) for detailed error messages

5. **Check backend logs** for server-side errors

## If Still Failing

1. Check MongoDB connection
2. Verify there are orders in the database
3. Check that the logged-in user has admin role
4. Review backend logs for specific error messages
