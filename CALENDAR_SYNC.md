# iOS Calendar Sync

## Overview
Events are automatically synced to your iOS device's default calendar when you:
- Create a new event
- Import events (e.g., Guardians schedule)
- Save events from the nearby catalog
- Duplicate an event

## How it Works

### Permissions
The first time you create an event, iOS will ask for calendar permissions. You must grant access to enable calendar sync.

### Sync Behavior
- **Create**: When you create an event, it's automatically added to your iOS calendar
- **Update**: When you edit an event, the calendar entry is updated
- **Delete**: When you delete an event, it's removed from your calendar
- **Duplicate**: Creates a new calendar entry for the duplicated event

### Visual Indicators
Events synced to your calendar show a green "✓ Synced to Calendar" badge on the event detail page.

## Calendar Data
The following information is synced:
- **Title**: Event name
- **Start/End Time**: Event schedule
- **Location**: Venue name and address
- **Notes**: Category, tags, and any additional notes

## Platforms
- ✅ **iOS**: Full support
- ✅ **Android**: Full support (uses device's default calendar)
- ❌ **Web**: Calendar sync not available on web

## Technical Details

### Files
- `utils/calendar-sync.ts` - Core calendar sync logic
- `providers/EventsProvider.tsx` - Integrates sync into event operations
- `types/index.ts` - Adds `calendarEventId` to Event type

### Functions
- `syncEventToCalendar()` - Creates calendar entry
- `updateCalendarEvent()` - Updates existing entry
- `deleteEventFromCalendar()` - Removes calendar entry
- `requestCalendarPermissions()` - Handles permissions

### Storage
Calendar event IDs are stored in the event object as `calendarEventId` to maintain the link between app events and calendar entries.

## Troubleshooting

### Permission Denied
If you denied calendar access, go to:
- **iOS**: Settings → Privacy & Security → Calendars → [App Name] → Enable
- **Android**: Settings → Apps → [App Name] → Permissions → Calendar → Allow

### Events Not Syncing
1. Check calendar permissions are granted
2. Verify you have a writable calendar on your device
3. Check console logs for error messages

### Deleting Synced Events
When you delete an event from the app, it's automatically removed from your calendar. However, if you delete the calendar entry directly from your calendar app, it won't be reflected in the 1Way app.
