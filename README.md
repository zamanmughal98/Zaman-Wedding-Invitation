# Zaman & Nimra - Wedding Invitation

A small, dependency-free Indo-Pak wedding invitation, personalised from the printed reception card. The design uses warm beige, cream, and brown ink (#4c3228 and #5b3e31), with restrained botanical details.

The confirmed functions run from **12 to 15 November 2026**. The reception is on **15 November at 7:00 PM**, at **Royal Vista Event Complex, Attock City**. Unconfirmed times and venues remain empty in the configuration and display as details to follow.

## Run and check

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
npm start        # http://127.0.0.1:8642
npm test         # rendering, calendars, responses, and project-page paths
npm run build    # complete static site in dist/
```

Use npm run dev while editing: it restarts the preview server when imported files change. Refresh the browser afterward. With npm start, restart the server after editing content or component modules.

## Make changes in one place

| Change | File |
| --- | --- |
| Names, hosts, dates, venues, contacts, email address | config/wedding.js |
| Show, hide, or reorder sections | wedding.sections in the config |
| Navigation links | wedding.navigation in the config |
| Colours, fonts, spacing | styles/theme.css |
| Printed-card layout and mobile adjustments | styles/stationery.css |
| Shared base styles | style.css |
| Phone approval and live wishes | backend/google-wishes/ and wishes.googleScriptUrl |
| Manual wishes fallback / backup format | data/wishes.json |
| Photos, animation, music | Add files to assets/, then reference them in config |
| Section HTML | src/components/ |
| Browser interactions | src/features/ |

Set a section's enabled value to false to hide it. Its code and content stay available. Navigation only includes enabled sections. The story is currently disabled because no personal story has been supplied. Attendance replies are also disabled for this close-family invitation; the RSVP link has been removed from navigation. The gallery has an empty state until photographs are added.

See [confirmed details and pending information](docs/wedding-content.md).

## Project structure

```text
config/wedding.js       editable content and section switches
styles/theme.css       shared theme colours, fonts, and spacing
styles/stationery.css  personalised printed-card styling
src/components/        section HTML
src/render.js          section registry and page assembly
src/document.js        prerendering and share metadata
src/features/          envelope, date reveal, media, sound, replies, wishes
src/submissions.js     email-app and WhatsApp message links
src/utils.js           dates, escaping, browser drafts, calendar files
data/wishes.json       manual approved wishes fallback
backend/google-wishes/ Google-owned storage and phone moderation (not deployed to Pages)
script.js              browser entry point
server.js              read-only local preview
scripts/build.mjs      dependency-free static build
assets/                envelope, future photos, video, and music
```

The preview server and build render the same components into HTML. The browser adds interactions. This keeps the invitation readable without JavaScript and works on GitHub Pages without a backend.

## Add the animation or personal images

Your friend's animation can be added without changing the page structure:

```js
// Fields within invitation in config/wedding.js:
heroVideo: '/assets/videos/couple.mp4',
heroVideoPoster: '/assets/photos/couple-poster.webp',
heroPhoto: null,
```

Add the corresponding files to assets/videos/ and assets/photos/. The video is muted, loops inline, and has a play/pause button. It respects reduced motion and pauses when the tab is hidden. Keep the video short and compressed for mobile connections. A poster is useful while it loads.

For a still image instead, leave heroVideo null and set heroPhoto. Its crop uses heroPhotoPosition. The matching portrait cards are ready for childhood photographs. Set couple.groom.photo and couple.bride.photo, use photoPosition to adjust the crop, and photoAlt to describe each image. Both full names use two matching lines so the cards stay aligned. Missing photos retain the initials. Gallery entries use src, alt, caption, and position. Keep personal images out of the repository until you are happy for site visitors to see them.

The initial envelope experience is retained. All local media paths work below the GitHub repository prefix.

## Dates without invented details

Each event has a date in YYYY-MM-DD form. Leave start and end null until their times are confirmed. timeLabel explains that the function is in the evening.

A date-only calendar download saves the day, with the pending evening timing in its description. For confirmed times, use an explicit offset such as 2026-11-15T19:00:00+05:00. The site displays Asia/Karachi venue time, and timed calendar files use UTC so overseas guests get the correct instant. No event end time is invented.

The countdown targets the confirmed Walima start. The date reveal refers to Nikah & Barat on 14 November.

Add mapsUrl only when the correct venue link is known. The venue section is optional; the event cards already contain each confirmed address.

## Email, WhatsApp, and approved wishes

Replies use **zamanbinishfaq+wedding@gmail.com**. WhatsApp uses the printed family contact **923490095926 (Zaighum Mughal)**. Change either in the config.

The attendance section is hidden. Its optional component remains available if needed later. Email and WhatsApp are retained only as the manual wishes fallback; the guest must tap Send in the app that opens.

For wishes, the prepared Google Sheets + Apps Script app adds private phone moderation. Guests submit directly, then you receive an email and use your private link to Approve, Reject, or Hide. Approved wishes appear automatically; no laptop or redeploy is needed for individual decisions. Google stores only the submitted names and wishes for this workflow.

Use your existing Sheet through Extensions > Apps Script; setup adds a Wishes tab while preserving other tabs. Complete the [one-time Google setup](docs/google-wishes-setup.md) and set wishes.googleScriptUrl to your public /exec URL. The public Google deployment URL is configured. Complete the live checks in the guide to verify storage and email delivery. Never put the private moderation link in the repository.

When that URL is empty, email/WhatsApp and the manually approved data/wishes.json wall remain available. The Google wall and manual JSON are separate modes so that an old JSON copy cannot reintroduce a hidden wish.

See [response setup](docs/response-setup.md) and [JSON backup details](data/README.md).

## Sound and accessibility

Music is off until an explicit tap. Add music.src for an MP3, or use the optional quiet ambient chimes. Disable it with music.enabled: false.

The envelope appears on every page refresh and can also be replayed from the footer. Opening a direct section link skips it initially; refreshing that page shows the envelope again. Native scrolling, keyboard-accessible dialogs, an alternative date-reveal button, visible focus states, reduced motion, and print styles are included.

## GitHub Pages

The included .github/workflows/pages.yml tests and builds the site when changes reach main. Pull requests run checks without publishing.

1. Push the changes and merge them into main.
2. In repository Settings > Pages > Build and deployment, set Source to GitHub Actions.
3. Run the Build and deploy wedding invitation workflow on main, or push a new commit to main.

The site URL is **https://zamanmughal98.github.io/Zaman-Wedding-Invitation/**.

Deploy dist/, rather than the raw repository, when using a custom host. GitHub Pages does not run server.js. Styles, modules, media, and the public wishes file use paths that stay inside the project.

The workflow supplies SITE_URL for share metadata. Local builds use site.url. Rebuild after changing the title, description, or preview image.

The source PDF remains a local reference and is not tracked. Preview files, build output, local credentials, and obsolete hosting metadata are ignored. Backend source, setup documentation, and tests belong in the repository, but are excluded from the public dist/ build. Keep moderation keys and Sheet settings in Google Script properties.

Envelope artwork provenance is in assets/images/README.md.
