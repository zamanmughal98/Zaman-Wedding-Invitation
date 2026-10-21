# One-time Google setup for phone moderation

The code is ready in **backend/google-wishes/**. It runs in your Google account. Your existing GitHub Pages invitation stays on the same URL.

After setup, the flow is:

1. A guest submits a name and wish on the invitation.
2. The wish is saved in your private Google Sheet with status pending.
3. A moderation email arrives at **zamanbinishfaq+wedding@gmail.com**, when Google mail quota is available.
4. Open the private link on your phone. Tap **Approve**, **Reject**, or **Hide from website**.
5. The wall reads approved wishes automatically. Visitors see updates on refresh, when returning to the tab, or within about 30 seconds while it is open. No laptop, JSON editing, or GitHub redeploy is needed for individual decisions.

## Set up once

Use the Google account you want to own the private Sheet and send notifications. The plus-address above is the notification recipient, not a separate Google login.

1. Open the Google Sheet you created, then choose **Extensions > Apps Script**. This attaches the script to your existing Sheet. Name the project **Zaman & Nimra Wedding Wishes**. If you prefer a separate project, see the standalone option below.
2. Replace **Code.gs** with the contents of [Code.gs](../backend/google-wishes/Code.gs).
3. Use **+ > HTML**, name the file **Index**, and paste [Index.html](../backend/google-wishes/Index.html).
4. Open **Project Settings** and enable **Show appsscript.json manifest file in editor**. Replace that file with [appsscript.json](../backend/google-wishes/appsscript.json), then save.
5. In the editor's function selector, choose **initializeWeddingWishes** and click **Run**. Authorize the Sheet and email permissions for your own project. This adds a **Wishes** tab inside your existing Sheet and creates a private moderation key. Other tabs are preserved. Rerunning setup keeps existing wishes and the same key. If a Wishes tab already has unrelated columns, setup stops without replacing its data. Keep the Sheet private.
6. Choose **Deploy > New deployment > Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Deploy and copy the public URL ending in **/exec**. Anonymous access lets guests send wishes without Google sign-in; moderation still requires your separate private key.
7. In the function selector, run **emailModeratorLink**. This emails your private moderation link. Save that email or bookmark its link on your phone.
8. Put ONLY the public /exec URL in **config/wedding.js**:

```js
wishes: {
  // Keep the other wishes fields.
  googleScriptUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
}
```

9. Run **npm test** and **npm run build**, then use the normal GitHub Pages deployment. This one deployment switches the wall from manual JSON to Google moderation.

The private moderation link has **?view=admin#key=...**. Never paste that link into site configuration, a repository, or a guest message. Only the public /exec URL goes in the project. You can send that public URL to the developer for wiring; keep the private link to yourself.

## If you already created a standalone script

You can reuse your existing Sheet without recreating the Apps Script project. In **Project Settings > Script properties**, add **SHEET_ID** with the portion of your Sheet URL between **/d/** and **/edit**. Then run **initializeWeddingWishes** again using the updated Code.gs. It opens that Sheet and initializes only its Wishes tab.

An explicit SHEET_ID takes priority over a bound Sheet. If neither is available, setup creates a new private spreadsheet. Only editor setup uses the active Sheet; web-app requests use the saved ID, so guest requests do not depend on a Sheet being open.

The Google Sheet sharing URL and the deployed web-app URL serve different purposes. The Sheet stores data. The URL ending **/exec**, copied from the Apps Script deployment, is what goes in wishes.googleScriptUrl. A Sheet link by itself cannot connect the guest form or phone approval page.

## Public URL for notification links

The notification helper defaults to the configured public deployment URL. It does not rely on Apps Script returning a production URL while the editor runs. If the public deployment URL changes, set **WEB_APP_URL** in Script properties to the new **/exec** URL and update **wishes.googleScriptUrl** in the website configuration. Only the public URL belongs in this setting; the private key is added by the server.

## Editor function names

The function dropdown hides names ending in an underscore. Select **initializeWeddingWishes** for setup, **emailModeratorLink** for the private email, and **renewModeratorLink** to invalidate an exposed key. These visible commands check the active account against the account executing the script; anonymous visitors cannot use them. The updated manifest includes the account-email permission required for that check. Private helpers such as setup_ remain hidden.

## Verify before sharing

Submit one clearly labelled test wish from the public site. It should not appear publicly. Check your email and private queue, approve it, and refresh the public wall. Then hide it and confirm that it disappears. Try the public page in a private browser window to verify that guests do not need to sign in.

The local tests use fake Google services; they cannot prove that your Google deployment, anonymous access setting, or mail permissions are correct. This live check completes account setup.

## Use from your phone

- **Pending** shows wishes waiting for a decision.
- **Approved** shows public wishes. **Hide from website** removes one from public view.
- **Hidden / rejected** keeps removed and declined wishes private. They can be approved later.
- **Refresh** reloads the queue. You can use the bookmark even if an email does not arrive.
- **Download approved JSON** exports a public-message backup. It contains no moderation key.
- Merely opening an email or its link does not approve anything. Approval requires the button.

The Sheet stays private. Guests can create pending wishes and read approved wishes. They cannot read the review queue or change a decision.

## Ownership, limits, and recovery

The initial project requests permission to create/read/update your Sheet, send email, and read the signed-in account email to protect editor setup commands. It does not read your inbox or use FormSubmit. Google may display the usual warning for a personal, unverified Apps Script project when you authorize it as its owner.

[Google currently lists 100 email recipients per day for consumer accounts](https://developers.google.com/apps-script/guides/services/quotas). The app defaults to 100 new wishes per UTC day. If email quota runs out or sending fails, an already saved wish remains pending and visible in your private queue. The page does not promise that a notification arrived.

Private setup is stored in **Project Settings > Script properties**: SHEET_ID (your existing Sheet ID), MODERATOR_KEY, OWNER_EMAIL, DAILY_LIMIT, and optionally WEB_APP_URL. Do not commit these values. The guest-facing page receives none of them.

If your private link is exposed, run **renewModeratorLink** in the Apps Script editor. It invalidates the old key and emails a new link, without removing wishes. initializeWeddingWishes is safe to rerun and keeps existing data.

If you change backend code later, use **Deploy > Manage deployments > Edit > New version > Deploy** on the existing deployment. Saving editor files alone does not update its live version. Keep the public deployment URL the same.

## Apply the parchment guestbook design to an existing deployment

**Index.html contains both the public guestbook and the private dashboard. This design update affects only the public guestbook; the private dashboard is preserved.** It receives a guest name and message, saves it pending, and publishes it after your phone approval. It does not collect event selections, attendance, or guest counts. RSVP remains disabled.

The website cannot style the contents of the Google iframe. To apply the parchment cards, calligraphic form heading, and linen input fields:

1. Open your existing **Zaman & Nimra Wedding Wishes** Apps Script project.
2. Open its **Index.html** file and replace its contents with [the updated Index.html](../backend/google-wishes/Index.html). Save.
3. Choose **Deploy > Manage deployments > Edit (pencil) > New version > Deploy** on the existing wishes deployment.
4. Refresh the invitation. The public /exec URL and your saved private moderation link stay the same.

Do not rerun setup or replace Code.gs or appsscript.json for this visual update. No Sheet changes are needed. The public-only body.guestbook CSS changes the card, form, and page colours; the admin page and approval logic stay as before. Its palette matches the --guestbook-* tokens in styles/theme.css.

## JSON fallback

When googleScriptUrl is empty, the existing email/WhatsApp plus manually deployed data/wishes.json workflow remains available. When Google mode is enabled, the wall uses Google exclusively; it does not merge an old JSON file that could reintroduce a hidden wish.

Backend source, private setup, and tests are not copied into the public dist folder. Only the public widget URL and website code are deployed to GitHub Pages.

Technical references: [scripts attached to Sheets](https://developers.google.com/apps-script/guides/bound), [Apps Script web apps](https://developers.google.com/apps-script/guides/web), [client/server calls](https://developers.google.com/apps-script/guides/html/communication), and [URL fragments](https://developers.google.com/apps-script/guides/html/reference/url).
