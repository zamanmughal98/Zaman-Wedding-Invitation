# Startup and slow connections

The first screen prioritizes the envelope and its controls. The complete invitation, including the real wish form, is already rendered in the served HTML. Music gesture handlers, the opening flow, the language switch and local wish drafts initialize first; navigation, countdown, scratch card, gallery and other secondary interactions load after the seal or Skip is used. Direct section links start those interactions immediately.

If the secondary code cannot load, the bootstrap retries and shows **Try again** after three failed attempts. That button and an `online` event start a new retry budget. The rendered invitation remains available during recovery.

## Media delivered to guests

Configuration selects the runtime variants; it does not require re-encoding during a normal build. The unused original MP3 and monogram PNG have been removed from the public assets. Both MP4 sizes remain in use, and the envelope PNG is the social-sharing image. The table records the source sizes for comparison.

| Asset | Original bytes | Runtime bytes |
| --- | ---: | ---: |
| Envelope PNG → 512 px WebP | 3,084,973 | 58,366 |
| Envelope PNG → 768 px WebP | 3,084,973 | 127,892 |
| Envelope PNG → 1024 px WebP | 3,084,973 | 213,822 |
| Transparent monogram PNG → WebP | 1,056,215 | 27,340 |
| Full Samjhawan track, MP3 → AAC/M4A | 6,167,164 | 1,873,530 |
| Opening film → lighter MP4 | 1,666,633 | 745,652 |

The envelope image and its preload share the same `srcset` and `sizes`, so the browser can select one image for its viewport and pixel density. `envelope.imageSources` and `imageSizes` define this selection. The monogram retains transparency. The lighter audio contains the full track and starts only after a user gesture.

## Opening film

`envelope.film.src` is the original optimized film, `lightSrc` is the smaller version and `poster` is the still shown while it starts. Phones and detected slower connections select the lighter film.

Tapping the seal always opens the film, including on slow connections and in data-saving mode. Reduced motion removes the opening transition and zoom instead of skipping the film. Loading and buffering show a short status message without advancing to the invitation. If playback fails, **Play film** retries; **Skip to invitation** remains available throughout. Finishing the film opens the invitation automatically.

The film prewarms only when the browser reports a sufficiently fast 4G connection. Unknown or slower connections wait for the tap. Skipping an unfinished film clears its source so the download can stop competing with the invitation.

## Fonts and guestbook

Google font stylesheets load without blocking the opening controls. The page uses its local fallback fonts while those downloads finish. The larger Nastaliq calligraphy stylesheet is requested when Urdu is selected; the guest's language choice still updates the page immediately.

The real form renders with the website, independently of Google. Drafts restore locally, so visitors can write immediately even if Google is slow or unavailable. The wishes iframe starts in the background after the priority envelope images have loaded; it no longer waits for the visitor to reach the section or finish the opening. A compact loading message replaces the former empty 900px frame until the authenticated Google ready/resize message arrives.

Apps Script returns its HTML without reading Sheets. It then separately requests six approved wishes with saved translations, shared counts and the browser's selected reactions. Each public read reuses one spreadsheet handle across those tabs. No provider translation is needed for this read. The local form submits through a narrowly scoped public bridge and clears its draft only after confirmed acceptance. Connection failures retain the draft and allow retry with the same request ID.

**See more wishes** appends another six on demand. Refreshes update the range already opened and reuse unchanged cards. Public font stylesheets load without holding up the cards; Urdu fonts are requested only for the Urdu view. This reduces upfront work while preserving the single website scroll.

GitHub Pages serves the static invitation; both local preview and the published website use the configured Google Apps Script service for wishes. Publishing the website can improve its own startup, but it cannot remove Google's iframe startup, server execution or network delay. Test the public wall after updating the existing wishes deployment, rather than expecting local backend source edits to change the live service. No fixed loading time is guaranteed.

## Build and deployment

1. Run `npm ci` using Node.js 22 or newer.
2. Run `npm test` and `npm run build`.
3. Push the source, lockfile, build helper and configured media variants through the existing GitHub Pages workflow, or deploy the resulting `dist/` directory on the configured static host.

esbuild runs only during the build. It combines the CSS, rewrites ornament URLs and emits minified JavaScript/CSS with hashed filenames under `dist/build/`. Secondary interactions use separate chunks. The published directory contains those bundles, public assets and data, without duplicate source module and stylesheet trees. The browser runs native JavaScript without a client framework. Local preview continues to serve the editable source modules and stylesheets.

Update the existing wishes Apps Script deployment first, then publish the website changes through GitHub Pages. The local form bridge, updated controls, pagination and automatic iframe height require matching versions; follow [the batch-loading setup](google-wishes-setup.md#load-six-wishes-at-a-time-with-one-website-scroll). Publishing the website does not publish Apps Script source.

## Verification

An earlier cold-cache Chrome comparison of the startup optimization used a 390 × 844 viewport at 2× pixel density, approximately 0.8 Mbps download speed, 200 ms latency and 4× CPU slowdown. Both builds were served with compressed text assets; external font requests were blocked in both measurements to isolate the website's own downloads.

| Until envelope artwork, monogram and opening controls were ready | Previous build | Optimized build |
| --- | ---: | ---: |
| Time | 43.9 s | 2.5 s |
| Transferred site data | 4.22 MB | 0.20 MB |

These are controlled local measurements, rather than a guarantee for every device or network. Separate browser checks also held font requests indefinitely, stalled video, verified the film on data-saving connections and manual replay, and simulated a failed secondary-code download followed by successful automatic retry.

The local wish-form checks additionally hold the complete Google document response and delay its wishes request. The form remains visible and editable, drafts survive refresh, and the wall occupies only a compact loading area. Nested-frame checks cover submission confirmation, failures, delayed replies and retries without duplicate saves.

Measure the built website with the cache disabled and record the connection, viewport and CPU throttle used. Useful checks include the time until the envelope image and seal are ready, bytes transferred before the first tap, and the requests made before opening the invitation or reaching the guestbook.

Also check blocked font requests, delayed or blocked video, an early seal tap with music, Urdu switching, reduced motion, manual replay, direct section links, interrupted secondary-code loading and wish drafts. Actual opening times depend on the connection and device; the media sizes above are file measurements.

## Guest photo and video upload speed

The separate photo service sends original bytes directly to Drive, pipelines authorization and confirmation, and adapts video chunks from 8 MiB up to a 32 MiB ceiling. Four bounded file lifecycles share two byte-transfer slots and two prioritized control slots. Fresh permission and parent checks are read in parallel, known folder locations avoid repeated searches, and unique file IDs are reserved in small durable batches. The legacy relay and older client responses remain supported.

A hidden tab no longer intentionally pauses the queue while the browser keeps it running. Actual suspension, offline recovery and manual pause remain distinct; browser closure or phone suspension can still interrupt uploads. Screen-awake and browser-tab locking retain their existing roles.

See [upload performance and recovery](upload-performance.md) for the architecture, real nine-MiB baseline, request-count comparisons and validation. The current live test measured about 29 seconds on the previous deployment and confirmed direct transfer without relay fallback. Live improvement must be measured after deploying the updated photo service; local synthetic timings do not establish real Google throughput.

Generate and deploy the combined photo Code.gs using [the photo setup guide](google-photos-setup.md#update-the-google-uploader). Saving editor changes or pushing GitHub does not update the photo web app. Existing scopes, public URL, folders, ledger and the separate wishes deployment are retained.
