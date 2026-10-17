# Ivory Garden · Wedding Invitation

An elegant Indo-Pak invitation based on the experience of [Noor-e-Nikah](https://invitima.com/templates/noor-e-nikah), with the original project's ivory, deep green, antique gold, and blush palette. This implementation has its own code, illustrations, and envelope artwork.

The names, dates, stories, families, and venues are **sample content**. Replace them before sharing with wedding guests.

## Run locally

Requires Node.js 22 or newer. There are no dependencies to install.

```sh
npm start
```

Open **http://127.0.0.1:8642**. After editing a file, refresh the page. `npm run dev` also restarts the server when source files change. Use `PORT=...` in your shell to select a different port.

```sh
npm test          # behaviour, calendar, rendering, and preview-server checks
npm run build    # produces a complete static website in dist/
```

## Where to make changes

| Change | File |
| --- | --- |
| Names, initials, dates, text, event details, contacts | `config/wedding.js` |
| Hide, show, or reorder sections | `wedding.sections` in the config |
| Navigation links | `wedding.navigation` in the config |
| Colours, fonts, page width, spacing | `styles/theme.css` |
| Layout, responsive rules, component appearance | `style.css` |
| Photos | Add to `assets/photos/`, then set the path in the config |
| Background music | Add an MP3 to `assets/`, then set `wedding.music.src` |
| Section markup | `src/components/` |
| Interactions | `src/features/` |

## Architecture

```text
config/wedding.js       content and feature switches
styles/theme.css       shared theme tokens
src/components/        functions returning each section's HTML
src/render.js          section registry and page assembly
src/document.js        pre-rendered HTML and share metadata
src/features/          envelope, scrolling, gallery, date reveal, sound, responses
src/utils.js           dates, safe HTML, storage, calendar files
script.js              browser entry point: initialise enabled features
server.js              local preview; only serves website assets
scripts/build.mjs      dependency-free static build
assets/                artwork, future photos, and music
```

Components render on the preview server and during the static build. The browser adds interactions to the resulting HTML. This keeps the invitation readable without JavaScript and gives link-preview crawlers real content. There is no framework, bundler, or backend to learn.

To add a section, create a component, register it in `src/render.js`, and add its id to `wedding.sections`. To remove a section, set `enabled: false`. Features skip sections that are absent.

## Add personal photographs

```js
invitation: {
  heroPhoto: '/assets/photos/couple.webp',
  heroPhotoPosition: 'center 25%',
  // Keep the other invitation fields.
}
```

Portraits use `couple.bride.photo` and `couple.groom.photo`. Gallery entries use `src`, descriptive `alt`, `caption`, and `position`. Empty photo slots show theme-aware vector artwork. Missing photo files also fall back safely.

Prefer WebP or JPEG under about 400 KB. Keep faces away from cropped edges and adjust `position` as needed.

## Dates and ceremonies

Use ISO timestamps with an explicit offset, such as `2027-06-12T16:00:00+05:00`. Set `site.timeZone` to the venue's timezone. The countdown measures a single real instant, and calendar files use UTC, so overseas guests receive the correct time.

Every event has its own id, title, Urdu label, description, start/end, venue/address, map link, dress code, and illustration. Set a real `mapsUrl` to enable directions; until then the page says directions will follow.

## RSVP and wishes

The default invitation is a **preview**. RSVP drafts and wishes are stored in the visitor's browser and are never presented as having reached the family. Guests can download their response. Nothing is shared across devices.

For real RSVP collection, set `rsvp.endpoint` to an endpoint you control. It receives a JSON POST with `weddingId`, `name`, `contact`, `attendance`, `guests`, `events`, `message`, and `updatedAt`. A 2xx status means accepted; failures retain the form and allow retry. The service must handle validation, rate limiting, and storage. This repository does not include that service.

Set `rsvp.contactPhone` to international digits to offer a WhatsApp confirmation link. Contact links are only shown for configured numbers. Wishes remain local until a shared service is added; the UI explains this.

## Sound and accessibility

Sound is off by default and starts only after an explicit tap. Without an MP3, the music button plays quiet original ambient chimes. It stops when the tab is hidden. Disable it with `music.enabled: false`.

The envelope remembers an opening for the current tab session and can be replayed from the footer. Direct links such as `/#celebrations` skip the envelope. Native scrolling, keyboard-accessible dialogs, an alternative reveal button, visible focus states, reduced-motion support, and print styles are included.

## Build and hosting

`npm run build` writes a static website into `dist/`. Deploy that folder on any static host. `.openai/hosting.json` contains the identity for the private Sites preview. Local QA files live in ignored `.preview/`; the source PDF is excluded from the static build.

### GitHub Pages

The repository includes `.github/workflows/pages.yml`. It checks the invitation, builds `dist/`, and publishes that folder when changes reach `main`. Pull requests to `main` run the same checks without publishing.

1. Push the changes and merge them into `main`.
2. Open the repository's **Settings → Pages → Build and deployment**.
3. Set **Source** to **GitHub Actions**.
4. Open **Actions → Build and deploy wedding invitation** and run it on `main`, or push a new commit to `main`.

The public URL is **https://zamanmughal98.github.io/Zaman-Wedding-Invitation/**.

Publish `dist/` rather than the raw repository when using a custom deployment. GitHub Pages does not run `server.js`. The generated HTML already contains the invitation, so it remains readable without JavaScript.

Stylesheets and JavaScript entry points use relative paths. `assetUrl()` in `src/utils.js` keeps configured photos, the envelope, and music inside the project folder, including existing `/assets/...` values. The same files work on a project page, an origin-root site, or a custom domain; there is no repository prefix to repeat throughout the components. Remote `https://...` image URLs keep their original destination.

`site.url` controls absolute share URLs for local builds. The Pages workflow supplies `SITE_URL` from the actual Pages configuration, so deployed share previews also work with a custom domain. Rebuild after changing the title, description, or preview image. `site.previewImage` currently uses the original envelope artwork. Set `site.preview: false` after replacing all sample details.

Artwork provenance and the generation prompt are in `assets/images/README.md`.
