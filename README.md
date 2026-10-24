# Zaman & Nimra - Wedding Invitation

A configurable Indo-Pak wedding invitation built with native HTML, CSS and JavaScript. The confirmed celebrations run from **12 to 15 November 2026**, with Walima at **7:00 PM on 15 November**, Royal Vista Event Complex, Attock City.

## Run and verify

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
npm start        # local preview at http://127.0.0.1:8642
npm run dev      # restart the preview when imported JavaScript changes
npm test         # invitation, calendars, music, moderation, links and project paths
npm run build    # publishable website in dist/
npm run sync:locales # regenerate the guest language resources for Apps Script
```

Refresh the browser after editing. With npm start, restart the server after changing content or component modules. GitHub Pages serves the built static files; it does not run server.js.

## Edit the invitation

| Change | Source |
| --- | --- |
| Names, dates, venues, contacts and public service URLs | config/wedding.js |
| Hide or reorder active sections | wedding.sections in the config |
| Navigation | wedding.navigation in the config |
| Colours, fonts and shared spacing | styles/theme.css |
| Header, section surfaces and decorative borders | styles/layout.css |
| Opening card, countdown and scratch date | styles/invitation.css |
| Couple, family and event cards | styles/people-events.css |
| Gallery and guest outfit palettes | styles/memories-attire.css |
| Shared fields and mobile adjustments | styles/forms-responsive.css |
| Guestbook, uploads and linen panels | styles/guest-services.css |
| Base elements, accessibility and responsive defaults | styles/base.css and styles/responsive.css |
| Authored Urdu text and right-to-left layout | config/urdu.js, config/urdu-photos.js and styles/language.css |
| A section's HTML | its named module in src/components/ |
| A browser interaction | its named module in src/features/ |

The section registry is in src/render.js. Existing entry modules group imports; edit the named implementation file. See the [architecture guide](docs/architecture.md) for the module map and stylesheet order.

The retired attendance and story sections have been removed. Every remaining section can be hidden or reordered through configuration; navigation includes enabled sections only. The gallery has an empty state when no photographs are configured.

Guests can choose English or اردو on the envelope and in the header; `?lang=ur` opens Urdu directly. The browser remembers their choice. Approved wishes have independent Original / English / اردو controls, and editing the original invalidates its saved translations. See the [language and deployment guide](docs/urdu-setup.md).

## Content and media

The [confirmed content guide](docs/wedding-content.md) records the schedule and remaining details. The first three functions are evenings with exact times to follow. Their calendar downloads save the day without inventing a start time. The countdown uses the confirmed Walima start; the scratch card reveals Nikah & Barat on 14 November.

Personal photographs and the shared monogram live in assets/images/. Portrait paths, descriptions and crops are configurable; both names retain matching lines. The supplied shared childhood photo opens on tap in the gallery. See the [image notes](assets/images/README.md).

An optional animation can use invitation.heroVideo and heroVideoPoster; a still image can use heroPhoto. Add only media intended for site visitors. The video is muted, loops inline, supports play/pause, respects reduced motion and pauses when the tab is hidden.

Guest outfit palettes are optional inspiration. Edit dressCode.looks; event names and dates come from the main event configuration. Personal and family wardrobe plans are not published. Palette colours use --fabric-* and --outfit-*-paper tokens.

The supplied Samjhawan track starts on the first envelope/entry tap and loops softly. The sound button pauses or resumes it, and hiding or leaving the page pauses playback. Set music.src, volume or startOnOpen in the config; set music.enabled to false to remove the control. No audio starts on page load.

The envelope appears on every refresh and can be replayed from the footer. Direct section links skip it initially. Scratch colours use --scratch-* tokens. Keyboard dialogs, a tap-to-reveal alternative, image fallbacks, reduced motion and print styles are retained.

The seal tap opens the supplied 10-second wedding film, then reveals the invitation. Configure it with `envelope.film.src` and `poster`; remove `film` to go straight from the seal to the invitation. The silent, optimised MP4 fills the opening with softly fading edges and pause, skip and music controls. Every seal tap can play it again, including after refreshing in the same tab. Reduced motion skips automatic film playback, and blocked or slow playback falls back to the invitation. A footer link replays the film on request. See the [opening film notes](assets/video/README.md).

## Google wishes and private uploads

The two Google services are separate from this static website:

- **Wishes:** backend/google-wishes/ contains the source for Google Sheets storage, phone approval, guest translations and shared reactions. Only approved wishes appear. Guests can change or remove their reaction; one exact-name wish can be pinned in the public JavaScript. Translation is generated on demand and cached by current message text and target language. See the [wishes guide](docs/google-wishes-setup.md) and [translation setup](docs/urdu-setup.md).
- **Photos and videos:** photos.googleScriptUrl opens the private uploader. It supports photos up to 25 MiB and videos up to 1 GiB, organised by celebration and guest. Guests cannot browse others' files. Keep the uploader open until it finishes. Source and recovery tools remain in ignored .local/google-photos/. See the [upload guide](docs/google-photos-setup.md).

Public configuration contains only public /exec URLs. Keep moderation keys, private Drive settings and service properties outside the repository.

The two tracked GuestLocale.html files are generated deployment resources. Keep them with their source dictionaries and generator so the separate Google projects can be updated or recovered. `npm run sync:locales` also rebuilds the combined photo Code.gs when the private uploader source is available; it does not rewrite that source or deploy either Google service.

When wishes.googleScriptUrl is empty, the email/WhatsApp and approved-JSON wishes fallback remains available. Email uses responses.email; WhatsApp uses responses.whatsappPhone. The guest must tap Send in the opened app. The manual wall is not merged with Google mode, so old JSON cannot restore a hidden wish. See [response maintenance](docs/response-setup.md) and [JSON backup format](data/README.md).

## GitHub Pages

The existing workflow tests and builds changes reaching main; pull requests run checks without publishing. In repository Settings > Pages, choose **GitHub Actions** as the build source.

Published invitation: **https://zamanmughal98.github.io/Zaman-Wedding-Invitation/**

Deploy dist/ on a custom static host. Local styles, modules and media remain inside the repository URL prefix. The workflow supplies SITE_URL for share metadata; local builds use site.url. Rebuild after changing share metadata.

The source PDF, references, preview artifacts, build output, local service tools and credentials are ignored. Backend source, documentation and tests are tracked for maintenance but excluded from the public build. Removing them merely because they are not browser assets would remove service recovery and regression checks.
