# Wishes and family replies

Notification recipient: **zamandata98+wedding@gmail.com** only. Existing Apps Script deployments must set **OWNER_EMAIL** to this exact address in **Project Settings > Script properties**; changing the repository default alone does not update the live setting.

## Wedding wishes: approval from your phone

The Google Sheets + Apps Script workflow lives in backend/google-wishes/. The public deployment URL is configured, and the live submission and approval flow has been tested from a phone.

Guests submit a name and wish directly in the embedded wall. Wishes stay pending until you approve them from the private moderation link emailed to you. Rejecting or hiding a wish keeps it off the public wall. Individual moderation decisions require no laptop, file changes, or redeploys.

Google stores names and wishes in your private Sheet. Notification emails use your own Apps Script account and may be limited by its mail quota. The queue still works if a notification fails. Never share your moderation key or put it in site config.

The website's guestbook frame, heading, and surrounding spacing are styled in styles/guest-services.css. These presentation changes do not require Google setup changes. The embedded form and private dashboard remain controlled by the existing Google app.

See the [Google setup and recovery guide](google-wishes-setup.md) when maintaining that app.

## Attendance replies are removed

The attendance section, its browser code and its unused configuration have been removed. Guests use the wishes wall without an attendance form.

## Manual wishes fallback

When wishes.googleScriptUrl is empty, wishes can be sent through email or WhatsApp and published manually in data/wishes.json. See [the JSON format](../data/README.md).

Email opens the guest's email app with a prepared wish. WhatsApp uses the printed card's **0349 0095926 (Zaighum Mughal)**, retained in responses.whatsappPhone as **923490095926**. The guest must tap Send in either app. Opening the app does not prove delivery.

The GitHub Pages files alone cannot store shared submissions. The Google app provides that storage and moderation; JSON remains a backup/export option.
