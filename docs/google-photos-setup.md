# Private photo and video uploads

The invitation's **Share photos & videos** button opens the Google Apps Script uploader. Only its public `/exec` URL belongs in `photos.googleScriptUrl` in `config/wedding.js`. Guests upload without signing into your Google account and cannot browse other guests' files.

## Formats and limits

| Media | Supported formats | Maximum per file |
| --- | --- | --- |
| Photos | JPEG/JPG, PNG, WebP, HEIC, HEIF, GIF, AVIF | 25 MiB, displayed as 25 MB |
| Videos | MP4, MOV, M4V, WebM, 3GP/3GPP | 1 GiB, displayed as 1 GB |

The video limit is 1,073,741,824 bytes. The browser checks file sizes before preparation; the Google service also enforces them. Files keep their original bytes, without compression or conversion. Preview and playback depend on the file's codec and the browser or Drive viewer.

Choose up to **20 files per selection**, with up to **60 pending files** in the queue. Daily application defaults allow **2,000 new uploads and 20 GiB combined across all guests**, using UTC dates. These are separate from Drive capacity and Google's service quotas; retries of an accepted job reuse its reservation.

## Faster direct transfers

The uploader keeps the same controls, queue, event/guest folders, file limits, and original media quality. A matching photo Apps Script deployment enables this transfer path:

1. The browser validates the file, calculates its digest, and submits metadata plus at most a 64 KiB header sample.
2. Apps Script authorizes that upload, enforces its size and daily allowance, checks the private destination, and saves a resumable Drive session in the existing recovery ledger.
3. The browser sends original binary data directly to that file's Drive upload session in measured, adaptive chunks starting at **8 MiB** and growing up to **32 MiB**. A typical 2 MiB photo or 5 MiB clip uses one data request. File bytes no longer pass through Apps Script or Sheets for each 1 MiB.
4. Apps Script checks Drive's stored file size, type, parent folder and available SHA-256 checksum before the website marks it uploaded. The final bytes being sent is not itself confirmation.

The batch overlaps up to **four file lifecycles**, while keeping **two actual byte transfers and two control requests maximum**. Upcoming file authorization can overlap data transfer and confirmation. Confirmations have priority over queued setup. Each file keeps its chunks in confirmed byte order; the compatibility relay remains serialized. The browser-tab lock stays held until all workers settle, including during pause or errors.

The direct path normally needs **two Apps Script calls per file**: opening the session and confirming completion. Recovery, hidden browser response headers, or network failures can add calls. The original relay remains available automatically if a browser blocks direct cross-origin transfers; older open uploader pages also continue to work.

Only the authenticated uploader receives its own file-scoped session URL. The account OAuth token, private folder IDs, recovery spreadsheet, and other guests' upload sessions stay on the server. The browser keeps its copy of the session URL in page memory rather than recovery storage or public configuration; application code does not explicitly log it. Folder sharing is checked when opening/resuming and confirming an upload; keep the Drive parent Restricted throughout the event.

Within each Apps Script request, settings, the spreadsheet handle and the account token are reused. Those handles are discarded after that request, including on errors; permissions and quotas are checked again on later requests. Final direct-upload confirmation reads the stored file metadata without an extra empty session probe. A missing file still falls back to resumable reconciliation.

Small files up to 8 MiB use native browser SHA-256 where available. Larger files and older browsers retain incremental preparation with bounded memory. Files are not recompressed. Separate guests' binary transfers run independently of the Apps Script lock; the lock still protects folder creation, admission and recovery records.

Actual time still depends on the connection's **upload** rate and Google startup/service latency. An ISP's advertised download rate does not establish its upload rate. No fixed upload duration is promised. This follows [Google's resumable upload flow](https://developers.google.com/workspace/drive/api/guides/manage-uploads).

## Selecting files and recovering uploads

Enter your name and choose a celebration before selecting files. Each selection keeps those details. Editing the fields applies to the next selection and does not move earlier uploads.

Completed rows clear when a new selection is added. **Clear uploaded list** also clears receipts without deleting Drive files. Only pending files transfer. Where browser storage is available, completed records prevent re-uploading the same file for the same name and celebration in that browser. Another browser or cleared browser data does not share this history.

Keep the uploader page open until completion. Switching to another tab no longer intentionally pauses uploads; they continue while the browser keeps the document running. Actual freezing, locking the phone or closing the browser can suspend transfers. The site cannot guarantee uploads while closed or suspended.

When a guest has pressed Upload, the browser remembers which queued file IDs were submitted. If it reloads after being discarded, available saved photos can resume automatically where browser storage and the cross-tab Web Lock are supported. Merely selecting files never authorizes automatic upload. Manual pause and permanent errors cancel automatic restart; completed IDs are removed and resume records expire after seven days. Browsers without the cross-tab lock keep the explicit Continue action.

Device file copies are limited to 25 MiB each and 250 MiB combined, subject to browser storage availability. Larger files save recovery details without a full device copy. After a refresh, enter the same name and celebration and select the original file again to resume confirmed progress. Smaller files may also need reselection if the browser could not retain them.

Failures show an inline message and a dismissible alert with recovery instructions. Invalid files in a mixed selection are rejected while valid files remain queued. Transient failures retry automatically before showing an error; completed duplicates show an informational notice.

## Tabs and separate devices

Where browser Web Locks are supported, one tab per browser profile can upload at a time. Other tabs show **Uploads are running in another tab**. Use one tab for a batch, or wait for its active upload to finish before starting another tab.

Separate browsers, profiles, and devices have independent queues. Direct file transfers can run concurrently; Apps Script briefly coordinates admission and confirmation. The compatibility relay still processes its chunks under the existing script lock. Google quotas or busy periods can cause waiting, retries, or a pause requiring Continue uploads.

## Private Drive folders

Uploads are grouped by celebration, then guest name:

```text
Zaman & Nimra - Wedding 2026/
  2026-11-13 - Zaman's Mehndi/
    Person A/
      photos and videos...
    Person B/
      photos and videos...
  2026-11-15 - Walima Reception/
    Person A/
      photos and videos...
```

Use the same name across batches. Names are grouped without differences in letter case or repeated spaces. People using the same name share a folder; there is no identity verification without sign-in.

The date-based option uses Asia/Karachi. On 12-15 November 2026 it selects that day's celebration; other dates use **YYYY-MM-DD - Guest moments**. Choose a specific celebration when uploading older files.

Keep the wedding parent folder **Restricted**. Grant selected people **Viewer** access in Drive when needed. Sharing a parent folder also shares its contents and future uploads. The uploader refuses public or domain-wide destinations.

The separate **Private photo upload records** spreadsheet is a recovery ledger. Keep it private and preserve its JSON cells and **Uploads** tab.

## Update the Google uploader

The service source, HTML templates, bundled hashing helper, manifest, generator, and backend checks live in ignored `.local/google-photos/`. Generated deployment files live in ignored `.preview/google-photos/`. A fresh Git clone contains neither directory; keep a private backup or save the deployed combined Code.gs before changing computers.

1. Check and generate the bundle from the project root:

   ```sh
   node --test --experimental-test-isolation=none .local/google-photos/checks/check-backend.mjs .local/google-photos/checks/check-direct.mjs .local/google-photos/checks/check-throughput.mjs .local/google-photos/checks/check-adaptive.mjs .local/google-photos/checks/check-background.mjs
   node .local/google-photos/prepare.mjs
   ```

2. Copy the entire generated **.preview/google-photos/Code.gs** into **Code.gs** in the existing **Wedding Photos** Google project. The generated file includes all HTML; the modular source Code.gs alone is insufficient.
3. Save, then choose **Deploy > Manage deployments > Edit > Version: New version > Deploy**.
4. Keep the existing **Execute as: Me**, **Who has access: Anyone**, public URL, script properties, Drive folder, and recovery spreadsheet. This update requires no manifest changes or rerun of initializeWeddingPhotos.
5. Let a current batch finish, then reopen the public uploader to load the new version and perform the checks below.

Saving editor code alone does not update a deployed version. A GitHub push updates the invitation, while the Google uploader is deployed separately. The wishes service uses its own project and deployment.

For a new account, recover the local source first. Use the generated Code.gs and appsscript.json in a separate photo project, enable Drive API v3, run initializeWeddingPhotos as the owner, then deploy as a public web app executing as the owner. Configure only the resulting public `/exec` URL in the invitation.

## Verify a deployment

1. Reopen the uploader after deploying the new Apps Script version. Time a 2 MiB photo and a 5 MiB clip on the same device/network before and after the update. Direct uploads should send binary PUT requests to the Google Drive session; the normal path has one beginPhotoUpload and one getPhotoUploadStatus call per file. Do not share or export session URLs from browser developer tools.
2. Upload a mixed batch of phone photos and videos. Check original file sizes and the event/guest folder. Include real Android and iPhone files where available.
3. Add another file after a completed batch. Only the new file should transfer. Clear completed receipts, reselect an uploaded file, and confirm it is recognised in the same browser.
4. Repeat a name and celebration, then change each separately. Verify folder reuse for the same guest/event and separate folders for other guests/events.
5. Pause a large video within the limit, refresh, and reselect the original. Confirm recovery produces one completed Drive file. Large file bytes should not be retained in browser storage.
6. Try an oversized photo, a video over 1 GiB, and an unsupported format. Each should show clear feedback before transfer; valid files in a mixed batch should remain queued. Automated checks cover the exact 1 GiB boundary.
7. Interrupt the connection, reconnect, and continue. Verify the error instructions, saved progress, and completed files.
8. Upload a batch of at least four files, pause while two byte requests are active, refresh, and continue. Each original should appear once and a file's progress should not jump backward when another file completes. Test one failed file alongside a successful one; the remaining work should pause and preserve confirmed uploads.
9. Upload from a PC and another phone simultaneously. Verify independent queues and private files. Two tabs in the same browser profile should show the tab restriction where Web Locks are supported, even while the first tab has two active files.

References: [Drive folders](https://developers.google.com/workspace/drive/api/guides/folder), [resumable uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [Apps Script deployment](https://developers.google.com/apps-script/guides/web), and [service quotas](https://developers.google.com/apps-script/guides/services/quotas).

See [upload performance and recovery](upload-performance.md) for the current architecture, chunk policy, measured baseline, background behavior and verification details.
