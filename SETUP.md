# Setup Instructions

## Ticketmaster API Configuration

The app is showing a 401 error because the Ticketmaster API key needs to be configured.

### Steps to Fix:

1. **Get a Ticketmaster API Key:**
   - Visit https://developer.ticketmaster.com/
   - Click "Get Your API Key" or "Sign Up"
   - Create a free account
   - Once logged in, create a new app
   - Copy your **Consumer Key** (this is your API key)

2. **Add the API Key to your project:**
   - Open the `.env` file in the root of your project
   - Replace `your_api_key_here` with your actual API key:
   ```
   EXPO_PUBLIC_TICKETMASTER_API_KEY=your_actual_key_here
   ```

3. **Restart your development server:**
   - Stop the current Expo development server (Ctrl+C)
   - Restart it with:
   ```bash
   bun expo start
   ```
   - Refresh your app

### Important Notes:

- The API key must start with `EXPO_PUBLIC_` to be accessible in your React Native code
- Never commit your `.env` file to git (it's already in `.gitignore`)
- The free tier of Ticketmaster API has rate limits, so you may need to upgrade if you make many requests

### Testing:

After adding your API key and restarting:
1. Open the app
2. Navigate to the "Events" tab
3. Make sure location permissions are granted
4. You should now see real events from Ticketmaster appearing in the nearby events list

### Troubleshooting:

- **Still getting 401 errors?**
  - Double-check your API key is correct
  - Make sure you restarted the development server
  - Check the console logs for more details

- **No events showing?**
  - Verify your location is correct
  - Try adjusting the distance filter
  - Check if there are actually events in your area on Ticketmaster.com
