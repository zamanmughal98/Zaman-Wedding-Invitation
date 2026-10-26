# One-time Google setup for phone moderation

The code is ready in **backend/google-wishes/**. It runs in your Google account. Your existing GitHub Pages invitation stays on the same URL.

After setup, the flow is:

1. A guest submits a name and wish on the invitation.
2. The wish is saved in your private Google Sheet with status pending.
3. A moderation email arrives only at **zamandata98+wedding@gmail.com**, when Google mail quota is available.
4. Open the private link on your phone. Tap **Approve**, **Reject**, or **Hide from website**.
5. The wall reads approved wishes automatically. Visitors see updates on refresh, when returning to the tab, or within about 30 seconds while it is open. No laptop, JSON editing, or GitHub redeploy is needed for individual decisions.

## Set up once

Use the Google account you want to own the private Sheet and send notifications. The plus-address above is the notification recipient, not a separate Google login.

1. Open the Google Sheet you created, then choose **Extensions > Apps Script**. This attaches the script to your existing Sheet. Name the project **Zaman & Nimra Wedding Wishes**. If you prefer a separate project, see the standalone option below.
2. Replace **Code.gs** with the contents of [Code.gs](../backend/google-wishes/Code.gs).
3. Use **+ > HTML**, name the file **Index**, and paste [Index.html](../backend/google-wishes/Index.html). Add another HTML file named **GuestLocale** from `GuestLocale.html`, and Script files named **Translations** and **Reactions** from `Translations.gs` and `Reactions.gs`, all in `backend/google-wishes/`. For optional translation API configuration, see [the language setup guide](urdu-setup.md).
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

## Change the notification recipient on an existing deployment

In your existing wishes Apps Script project, open **Project Settings > Script properties > Edit script properties**. Set **OWNER_EMAIL** to exactly **zamandata98+wedding@gmail.com**, replacing the previous value, and save. This is the sole recipient for new-wish alerts and moderator-link emails.

The recipient setting does not change the account that owns the script or sends mail. Existing deployments read it on each request, so this property-only change needs no code deployment or website rebuild. Updating the default in the repository or rerunning setup does not replace an existing OWNER_EMAIL value.

To receive the current private moderation link at the new address, run **emailModeratorLink** from the Apps Script editor while signed in as the script owner. The existing moderation key and saved wishes are preserved.

### Activate using the complete replacement file

1. Sign in as the original script owner, **zamanbinishfaq@gmail.com**, and open the existing wishes Apps Script project.
2. Replace all contents of **Code.gs** with [the complete updated file](../backend/google-wishes/Code.gs) and save. Keep the existing Index.html and appsscript.json.
3. Select **activateWishNotifications** from the editor's function dropdown and click **Run**. Authorize if Google prompts. This explicitly replaces the saved OWNER_EMAIL with **zamandata98+wedding@gmail.com** and emails the existing private moderation link there. Existing wishes, the Sheet, the moderation key and daily limit are preserved.
4. Check the **zamandata98@gmail.com** inbox on your phone, including Spam, for **Your private wedding wishes moderation page**.
5. To publish the replacement code, use **Deploy > Manage deployments > Edit (pencil) > New version > Deploy** on the existing wishes web app. Keep its existing URL and access settings.
6. Submit one clearly labelled test wish from the website. Confirm that the alert reaches the new inbox, open its link, approve the wish and refresh the public wall.

Running the activation function changes the live recipient property immediately, even before step 5. Publishing step 5 makes the replacement code available to the existing public web app. No website rebuild is needed.

## Editor function names

The function dropdown hides names ending in an underscore. Select **initializeWeddingWishes** for setup, **activateWishNotifications** to apply the recipient configured at the top of Code.gs and email the current link, **emailModeratorLink** to resend that link, and **renewModeratorLink** to invalidate an exposed key. These visible commands check the active account against the account executing the script; anonymous visitors cannot use them. The updated manifest includes the account-email permission required for that check. Private helpers such as setup_ remain hidden.

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

## Add shared reactions and one pinned wish

For the existing wishes installation:

1. Replace **Code.gs** and **Index.html** with the current files in `backend/google-wishes/`.
2. Choose **+ > Script**, name it **Reactions**, and paste [Reactions.gs](../backend/google-wishes/Reactions.gs). Keep the existing Translations, GuestLocale, manifest and Script Properties.
3. Save, then choose **Deploy > Manage deployments > Edit (pencil) > New version > Deploy** on the existing deployment. Keep its URL and access settings. No setup rerun or photo-uploader update is needed.
4. Open the public wall in two browsers. Add a reaction in one and refresh wishes in the other to check the shared count. Change the reaction, then remove it, and check the count again.

Guests can choose **Like, Love, Care, Haha, Wow, Sad or Angry** on any approved wish. Each browser has one changeable or removable reaction per wish, without signing in. The private **WishReactions** Sheet tab is created automatically on the first reaction. Counts are shared; browser tokens and other visitors' individual choices are not exposed. Clearing browser storage or using another browser creates a separate identity. If storage is blocked, the browser identity lasts only until that page reloads.

In **Code.gs**, `config.pinnedWishName = 'Nimra Shafiq'` pins one matching approved wish at the top. The check trims surrounding spaces and requires that exact spelling and capitalization. If several match, only the newest matching approved wish is pinned. The first batch includes it even if it is older than the other wishes. The public JavaScript uses the same value, with the earlier name as a compatibility fallback. There are no pin controls in the moderation panel.

## Load six wishes at a time with one website scroll

The public wall starts with six wishes, including the pinned wish. They arrive with the Google document, together with available saved translations and shared reaction counts, so readable cards do not wait for another Apps Script call after the iframe starts. This browser's selected reactions refresh in the background. The reader opens the spreadsheet once per public request and shares that handle across the wishes, saved translations and reactions. It does not keep an approval cache: new documents and refreshes read current Sheet contents.

**See more wishes** fetches and appends the next six when clicked. Refresh updates the range already opened and reuses unchanged cards. Translation requests are limited to wishes entering the visible part of the page. Google still needs time to start its web app and read Sheets; moving the website from a local server to GitHub Pages does not remove that separate service delay.

This update needs both the Google guestbook and the website:

1. In the existing **Wedding Wishes** Apps Script project, replace **Code.gs**, **Index.html**, **Translations.gs**, **Reactions.gs** and **GuestLocale.html** with their matching current versions in `backend/google-wishes/`. Add a missing Script or HTML file under its matching name. Keep Script Properties and the existing Sheet.
2. Save and choose **Deploy > Manage deployments > Edit > New version > Deploy**, keeping the same public URL.
3. Push the website changes through the normal GitHub Pages process. Its new resize listener allows the iframe to grow and shrink with wishes, translations and reaction pickers. Publishing only the Apps Script files cannot update that listener in the main website.
4. Refresh the invitation. Confirm six wishes appear initially, **See more wishes** adds six, and scrolling continues through the whole website without an inner wishes scrollbar. Check English and Urdu, then change a reaction and refresh the wishes.

No setup function or new Script Property is required. The standalone guestbook also uses its normal page scroll. The manual JSON fallback renders six wishes at a time, although its static JSON file is downloaded together.

## If wishes fail after an update

An Apps Script error such as **`wishSourceVersion_ is not defined`** means **Translations.gs** is missing or does not match the deployed Code.gs. Replace it with the current file, then publish a **New version** of the existing deployment. Saving editor files alone does not publish them. Use the matching five-file set above when updating the complete guestbook; initialization is unnecessary.

The current reader also supports plain-text edits to name/message cells and normalizes Google Sheet Date cells for pagination. Optional translation or reaction helper failures leave approved wishes readable in their original form. Reaction storage validation still protects writes; check the private Apps Script execution logs if reaction controls are unavailable.

Technical references: [scripts attached to Sheets](https://developers.google.com/apps-script/guides/bound), [Apps Script web apps](https://developers.google.com/apps-script/guides/web), [client/server calls](https://developers.google.com/apps-script/guides/html/communication), and [URL fragments](https://developers.google.com/apps-script/guides/html/reference/url).
