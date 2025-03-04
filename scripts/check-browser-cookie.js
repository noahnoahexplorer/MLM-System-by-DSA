// scripts/check-browser-cookie.js
console.log(`
=== BROWSER COOKIE TROUBLESHOOTING GUIDE ===

If you're having issues with login, follow these steps to check your browser cookies:

1. Open your browser's developer tools:
   - Chrome/Edge: Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
   - Firefox: Press F12 or Ctrl+Shift+I

2. Navigate to the "Application" tab in Chrome/Edge or "Storage" tab in Firefox

3. In the left sidebar, find and click on "Cookies" and then select "http://localhost:3000"

4. Look for a cookie named "auth_token"
   - If it exists, check its properties:
     * HttpOnly should be true
     * Path should be "/"
     * SameSite should be "strict"

5. If the cookie is missing or has incorrect properties:
   - Clear all cookies for localhost
   - Try logging in again
   - Check if the cookie appears after login

6. If you still have issues:
   - Try using a different browser
   - Check if you have any browser extensions that might be blocking cookies
   - Make sure your browser settings allow cookies

7. Additional troubleshooting:
   - The login API is working correctly (confirmed by our debug script)
   - The session endpoint is working correctly (confirmed by our test script)
   - The issue might be related to how your browser is handling cookies

For more help, please provide:
- Which browser you're using
- Screenshots of your cookies in the developer tools
- Any error messages in the browser console
`); 