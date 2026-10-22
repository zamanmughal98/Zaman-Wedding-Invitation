# Architecture and maintenance

This is a static invitation with no framework or runtime package dependencies. Node is used for local preview, tests and the static build. Google Apps Script supplies the separately deployed wishes and upload services.

## Page assembly

1. config/wedding.js is the public content and configuration.
2. src/render.js maps enabled section IDs to render functions.
3. src/document.js prepares the same rendered HTML and share metadata for server.js and scripts/build.mjs.
4. script.js adds browser interactions to that HTML; it renders the page itself when opening unbuilt source on a static host.

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

Paths in the table are relative to src/. Small entry modules such as components/guest-details.js and features/interactions.js re-export the active implementations, preserving existing imports without duplicating their code.

src/utils.js holds shared escaping, safe URLs, dates, local drafts and calendar formatting. src/submissions.js builds manual wish email/WhatsApp links. The two *-service.js helpers validate public Google deployment URLs. SVG artwork is code in components/artwork.js; decorative masks and paper grain are assets/ornaments/.

## CSS order

The two original stylesheet entry paths are retained:

- style.css loads theme.css, base.css and responsive.css.
- styles/stationery.css loads layout.css, invitation.css, people-events.css, memories-attire.css, forms-responsive.css and guest-services.css, in that order.

All those files live under styles/. Base rules provide shared elements and layout; the invitation treatments override them deliberately. Preserve this order. Put palette changes in theme.css and section-specific adjustments in the named treatment file, rather than adding another override to an unrelated file.

The split preserves the original cascade. Retired RSVP/story selectors and confirmed unused illustration/swatch selectors were removed; differing declarations that provide intentional overrides or browser fallbacks were retained.

## Service boundaries

backend/google-wishes/ is the source for the already deployed Google wishes app. It contains both the guest UI and private moderation UI. It is not part of the public dist/ directory. Local source changes do not automatically redeploy Apps Script.

.local/google-photos/ contains the photo/video service source and owner tools. .preview/google-photos/ contains generated deployment material. These are private, ignored maintenance files; keep them or back them up outside Git. They are not abandoned website code.

The JSON wishes wall and email/WhatsApp links remain a supported fallback when the Google wishes URL is cleared. Keep this mode separate from the live Google wall so moderation cannot be bypassed by stale JSON.

## Testing and changes

Run npm test and npm run build after functional changes. The project-path checks traverse the JavaScript and CSS import graphs at both / and /Zaman-Wedding-Invitation/, including CSS assets. Moderation tests use local stand-ins and never send email or modify Google data.

For a new page section, add its renderer to src/render.js and its ID/content to config/wedding.js; add navigation only if needed. For an additional event, dates and names belong in events, while optional guest palette entries reference that event's ID.

Generated previews and browser profiles belong in ignored .preview/, not in source. Browser profiles are disposable; service source, recovery exports and supplied media are not. Build output is reproducible with npm run build.
