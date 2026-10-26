# Architecture and maintenance

This is a static invitation with no framework or runtime package dependencies. Node is used for local preview, tests and the static build. esbuild is a locked development dependency used to bundle the published assets. Google Apps Script supplies the separately deployed wishes and upload services.

## Page assembly

1. config/wedding.js is the public content and configuration.
2. src/render.js maps enabled section IDs to render functions.
3. src/document.js prepares the same rendered HTML and share metadata for server.js and scripts/build.mjs.
4. script.js initializes music gesture handlers, the envelope, guest language controls and the persistent local wish form first. It dynamically imports the renderer only when pre-rendered HTML is absent.
5. Opening or skipping the intro loads features/page.js for navigation, countdown, scratch card, gallery, shared controls, wishes and optional couple media. Direct section links load these interactions immediately. Failed secondary-code loads retry, then provide a **Try again** control after three failed attempts; reconnection starts a new retry budget.

| Area | Implementation |
| --- | --- |
| Envelope | components/envelope.js; features/invitation.js |
| Invitation, countdown and date card | components/hero.js; features/countdown.js and scratch.js |
| Couple and family | components/people.js |
| Event cards and calendar buttons | components/celebrations.js; features/shared-interactions.js |
| Gallery and lightbox | components/gallery.js; features/gallery.js |
| Venue | components/venue.js |
| Guest outfit inspiration | components/dress-code.js |
| Wishes wall and manual fallback | components/wishes.js; features/wishes.js |
| Footer | components/footer.js |
| Background track | features/music.js; features/toast.js |
| Guest language preference and in-place localization | features/language.js; localization.js |
| Optional Urdu calligraphy stylesheet | features/fonts.js |
| Deferred secondary interactions | features/page.js |

Paths in the table are relative to src/. The section registry and interaction initializer import the named implementations directly.

src/utils.js holds shared escaping, safe URLs, dates, local drafts and calendar formatting. src/submissions.js builds manual wish email/WhatsApp links. The two *-service.js helpers validate public Google deployment URLs. SVG artwork is code in components/artwork.js; decorative masks and paper grain are assets/ornaments/.

## CSS order

Local preview retains the source stylesheet entries:

- style.css loads theme.css, base.css and responsive.css.
- styles/stationery.css loads layout.css, invitation.css, people-events.css, memories-attire.css, forms-responsive.css, guest-services.css and opening-film.css, in that order.
- styles/language.css loads after those entry points and supplies the language controls and Urdu layout.

All those files live under styles/. Base rules provide shared elements and layout; the invitation treatments override them deliberately. Preserve this order. Put palette changes in theme.css and section-specific adjustments in the named treatment file, rather than adding another override to an unrelated file.

The split preserves the original cascade. Retired RSVP/story selectors and confirmed unused illustration/swatch selectors were removed; differing declarations that provide intentional overrides or browser fallbacks were retained.

styles/site.css combines those entries for production. scripts/bundle-client.mjs uses esbuild to flatten the CSS imports, rewrite ornament URLs, minify code and emit hashed entries and dynamic chunks under dist/build/. scripts/build.mjs replaces the source entry links in the rendered document with those bundle paths. Only the bundles, public assets and data are copied to dist/; the original module and stylesheet trees stay in the repository for development. Runtime media paths remain relative to the document, and chunk/ornament paths remain relative to their bundles, preserving GitHub Pages repository prefixes.

Google font stylesheets load without blocking the opening controls. features/fonts.js requests the Nastaliq stylesheet when Urdu is selected. The localizer preserves source text and avoids rescanning the entire page when the selected language has not changed. See [performance.md](performance.md) for media variants and startup behavior.

## Service boundaries

backend/google-wishes/ is the source for the already deployed Google wishes app. It contains both the guest UI and private moderation UI. It is not part of the public dist/ directory. Local source changes do not automatically redeploy Apps Script.

config/urdu.js and config/urdu-photos.js hold authored guest copy. src/localization.js translates interface text in place, excluding guest content. scripts/sync-guest-locales.mjs generates the two tracked GuestLocale.html deployment resources from those same sources. It can also regenerate the private photo bundle when its source is present, without modifying that source.

The wishes backend keeps originals in Wishes and cached translations in the separate WishTranslations and WishTranslationsEnglish tabs. Source fingerprints invalidate stale translations after edits. Public APIs serve only approved records and retain the earlier response fields for already open guest pages; private moderation continues to use originals.

Reactions.gs stores shared reactions in the private WishReactions tab, created on the first reaction. A browser token identifies one changeable or removable choice per approved wish; no guest login is required. Public responses expose counts, without browser tokens or other visitors' individual choices. Clearing browser storage creates a new identity. Code.gs supplies `pinnedWishName = 'Nimra Shafiq'` to Index.html so both the initial page and subsequent requests select the same newest approved full-name match. The name check trims surrounding spaces and otherwise requires exact spelling and capitalization; moderation has no pin controls.

getPublicWishesPage serves six wishes initially and another six per explicit request, using a created-at/ID cursor. The public doGet returns the HTML without reading Settings or Sheets; one separate request supplies approved wishes, saved translations, shared counts and this browser's selected reactions. The spreadsheet handle is shared within each read, without caching approval state between requests. Only the requested range receives translation and reaction metadata. Refreshes request the already opened range and reconcile cards by ID instead of rebuilding the wall. Visible cards alone enter the translation queue. The legacy getPublicWishes response remains available for older clients.

components/wishes.js includes the real form in the website HTML and a compact loading state for the approved wall. features/wishes-embed.js restores its draft immediately and starts Google after the priority envelope images are ready, without waiting for scrolling or intro completion. The embedded Google view hides its own form when the validated hostForm flag is set; standalone pages retain their form. A channel/origin/source-validated message bridge accepts only submitWish payloads and reports confirmed acceptance. Pending submissions time out without clearing drafts, and retries preserve request IDs for server-side deduplication. Language changes rotate the channel; stale messages cannot acknowledge a new submission.

Index.html measures its public content with ResizeObserver and sends changes through Google's iframe wrapper to the top website. The iframe stays out of layout behind the compact loading state until its authenticated ready/resize message arrives; then it grows with approved messages. This preserves one website scroll while supporting translations, reactions and language changes. Deploy the matching Apps Script version before publishing the new website so the bridge is available. The native JSON fallback appends six cards per click.

.local/google-photos/ contains the photo/video service source and owner tools. .preview/google-photos/ contains generated deployment material. These are private, ignored maintenance files; keep them or back them up outside Git. They are not abandoned website code.

The JSON wishes wall and email/WhatsApp links remain a supported fallback when the Google wishes URL is cleared. Keep this mode separate from the live Google wall so moderation cannot be bypassed by stale JSON.

## Testing and changes

Run npm ci to install the locked build tool, then npm test and npm run build after functional changes. The project-path checks traverse the JavaScript and CSS import graphs at both / and /Zaman-Wedding-Invitation/, including CSS assets. Moderation tests use local stand-ins and never send email or modify Google data. Use the built output when measuring production startup so bundled request counts are represented.

For a new page section, add its renderer to src/render.js and its ID/content to config/wedding.js; add navigation only if needed. For an additional event, dates and names belong in events, while optional guest palette entries reference that event's ID.

Generated previews and browser profiles belong in ignored .preview/, not in source. Browser profiles are disposable; service source, recovery exports and supplied media are not. Build output is reproducible with npm run build.
