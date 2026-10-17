# Attendance and wishes

Recipient: **zamanbinishfaq+wedding@gmail.com**.

## Wedding wishes: approval from your phone

The Google Sheets + Apps Script workflow is prepared in backend/google-wishes/. You can attach it to your existing Sheet using Extensions > Apps Script; setup adds a Wishes tab and preserves other tabs. Complete the [one-time Google setup](google-wishes-setup.md) and set wishes.googleScriptUrl to its public /exec URL.

Guests submit a name and wish directly in the embedded wall. Wishes stay pending until you approve them from the private moderation link emailed to you. Rejecting or hiding a wish keeps it off the public wall. Once connected, individual moderation decisions require no laptop, file changes, or redeploys.

Google stores names and wishes in your private Sheet. Notification emails use your own Apps Script account and may be limited by its mail quota. The queue still works if a notification fails. Never share your moderation key or put it in site config.

## Attendance replies

RSVP email opens the guest's email app with attendance choices, guest count, optional contact details, and message already filled in. The guest taps Send.

WhatsApp uses the card's **0349 0095926 (Zaighum Mughal)**, configured as **923490095926** in rsvp.contactPhone. Links prepare a message; the guest taps Send in WhatsApp. Change this number in config/wedding.js if replies should go to someone else.

The page does not claim delivery when either app opens. Attendance data is not placed on the public wishes wall.

## Manual JSON fallback

Until the Google URL is configured, wishes can still be sent through email or WhatsApp and published manually in data/wishes.json. See data/README.md for that format.

The GitHub Pages files alone cannot store guest submissions or implement shared approval. The Google app provides that storage and moderation; JSON remains a backup/export option.
