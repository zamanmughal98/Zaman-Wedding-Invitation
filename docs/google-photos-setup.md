# Private wedding photo uploads

The invitation's **Share your moments** button opens the separate Google Apps Script photo uploader. Only its public **/exec** address is configured in photos.googleScriptUrl in config/wedding.js. Guests do not sign into your Google account and cannot browse other guests' photos.

## Upload selections

Enter your name and choose the celebration **before** choosing photos. Use the same name each time to keep your photos in one guest folder. Each selected photo shows the name and celebration saved for it. Editing the fields applies to the next selection; it does not move earlier or unfinished uploads.

When another selection is added, completed rows automatically clear from the visible list. The **Clear uploaded list** button also clears completed rows. These actions leave the Drive photos untouched. Only pending photos are sent. Unfinished selections remain available to continue.

A small completed-upload record is kept in the same browser where storage permits. Reselecting the same photo for the same name and celebration is skipped, including after clearing the visible list or refreshing. A different name or celebration is a separate submission. This is browser-local duplicate prevention; clearing browser data or using another browser removes that history.

Original JPEG, PNG, WebP, HEIC and HEIF files are supported, up to 25 MiB each and 20 per selection. Uploads use chunks, retries, saved progress, and verified completion. Browser storage may not retain pending bytes; in that case the page asks guests to reselect the same photo.

## Drive folders

New submissions use this layout:

    Zaman & Nimra - Wedding 2026/
      2026-11-13 - Zaman's Mehndi/
        Person A/
          photos...
        Person B/
          photos...
      2026-11-15 - Walima Reception/
        Person A/
          photos...

Names are grouped without differences in letter case or repeated spaces. Guests using the same name share a folder; without sign-in, the site cannot verify whether two names identify the same person.

The date-based option resolves the event using Asia/Karachi. On 12-15 November 2026 it selects that day's wedding celebration; other dates use **YYYY-MM-DD - Guest moments**. Choosing the event explicitly is best when uploading older photos.

Files and in-progress jobs created before the guest-folder update stay in their original folders. The update neither moves nor deletes them. Repeated new batches reuse the event and guest folders.

Keep the wedding parent folder **Restricted**. Grant selected people **Viewer** access in Drive when you wish. Sharing the parent folder grants access to its contents, including future uploads. The uploader refuses public or domain-wide folders.

The separate **Private photo upload records** spreadsheet is a private recovery ledger. Do not publish it, edit its JSON cells, or rename the **Uploads** tab.

## Local owner maintenance

Google photo source and setup files are deliberately excluded from GitHub:

- .local/google-photos/Code.gs
- .local/google-photos/Index.html, Styles.html, Client.html
- .local/google-photos/appsscript.json
- .local/google-photos/prepare.mjs
- .local/google-photos/checks/

These files remain on the owner's computer. A fresh Git clone does not contain them. Keep a private backup or recover the deployed combined Code.gs from the Google editor before changing computers. Website-only tests do not depend on them. Existing wishes source is unchanged.

To verify and prepare a photo-service change locally:

    node --test .local/google-photos/checks/check-backend.mjs
    node .local/google-photos/prepare.mjs

The generator produces the combined **.preview/google-photos/Code.gs** containing server code and all HTML. Copy that entire generated file, rather than the separate source Code.gs, into the existing **Wedding Photos** project's Code.gs.

Save, then choose **Deploy > Manage deployments > Edit > Version: New version > Deploy**. Preserve the existing **Execute as: Me**, **Who has access: Anyone**, public /exec URL, script properties, Drive folder, and recovery spreadsheet. This update requires no manifest changes and no rerun of initializeWeddingPhotos.

Saving editor code alone does not update a deployed version. A GitHub push updates the invitation only; it does not update the separate Google service.

For first-time setup on another account, create a separate Apps Script project using the local generated Code.gs and appsscript.json; enable Drive API v3; run initializeWeddingPhotos as the owner; then deploy as a public web app executing as the owner. Leave the working wishes project unchanged.

## Verify after updating Google

1. Upload three small photos for one event and name.
2. Select a fourth photo. Earlier completed rows should clear; only the fourth should upload.
3. Repeat with the same name and event. Photos should use the same guest folder.
4. Change the event, then choose a new photo. It should use that person's folder under the other event.
5. Use another name for a new selection. Its folder should be separate.
6. Clear the completed list and reselect the same photo with the same name and event. It should be recognised as already uploaded in the same browser.
7. Pause a larger photo, refresh, reselect if needed, and continue. Verify one completed Drive file.
8. Another guest browser should see none of these selections or uploaded photos.

A phone can suspend uploads when locked or the browser closes. Keep the page open until completion; return to continue if interrupted. This website cannot guarantee background transfers.

Application limits are separate from your Drive capacity and Google's Apps Script quotas. Current local defaults are 2,000 newly accepted jobs and 20 GiB per UTC day; those limits do not guarantee Google's transfer throughput.

References: [Drive folders](https://developers.google.com/workspace/drive/api/guides/folder), [Drive resumable uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [Apps Script web apps and deployment](https://developers.google.com/apps-script/guides/web), and [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).
