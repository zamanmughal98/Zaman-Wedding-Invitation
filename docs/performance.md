# Startup and slow connections

The first screen prioritizes the envelope and its controls. The complete invitation is already rendered in the served HTML. Music gesture handlers, the opening flow and the language switch initialize first; navigation, countdown, scratch card, gallery, guestbook and other secondary interactions load after the seal or Skip is used. Direct section links start those interactions immediately.

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

The wishes iframe keeps its URL in `data-src` until it approaches the viewport and the intro has closed. Its selected language and resize channel are added before the first live request. Apps Script includes the first six approved wishes with the page configuration, so cards render without waiting for another request after Google's iframe starts. A background read updates the browser's selected reactions and current public data. Each public read reuses one spreadsheet handle for the wishes, saved translations and reaction counts. No provider translation is needed for this first read, and private or unapproved wishes never enter the page configuration.

**See more wishes** appends another six on demand. Refreshes update the range already opened and reuse unchanged cards. Public font stylesheets load without holding up the cards; Urdu fonts are requested only for the Urdu view. This reduces upfront work while preserving the single website scroll.

GitHub Pages serves the static invitation; both local preview and the published website use the configured Google Apps Script service for wishes. Publishing the website can improve its own startup, but it cannot remove Google's iframe startup, server execution or network delay. Test the public wall after updating the existing wishes deployment, rather than expecting local backend source edits to change the live service. No fixed loading time is guaranteed.

## Build and deployment

1. Run `npm ci` using Node.js 22 or newer.
2. Run `npm test` and `npm run build`.
3. Push the source, lockfile, build helper and configured media variants through the existing GitHub Pages workflow, or deploy the resulting `dist/` directory on the configured static host.

esbuild runs only during the build. It combines the CSS, rewrites ornament URLs and emits minified JavaScript/CSS with hashed filenames under `dist/build/`. Secondary interactions use separate chunks. The published directory contains those bundles, public assets and data, without duplicate source module and stylesheet trees. The browser runs native JavaScript without a client framework. Local preview continues to serve the editable source modules and stylesheets.

Publish the website changes through GitHub Pages. The wishes first-batch rendering, updated controls, pagination and automatic iframe height require the separate wishes Apps Script deployment; follow [the batch-loading setup](google-wishes-setup.md#load-six-wishes-at-a-time-with-one-website-scroll). Publishing the website does not publish Apps Script source.

## Verification

A cold-cache Chrome comparison used a 390 × 844 viewport at 2× pixel density, approximately 0.8 Mbps download speed, 200 ms latency and 4× CPU slowdown. Both builds were served with compressed text assets; external font requests were blocked in both measurements to isolate the website's own downloads.

| Until envelope artwork, monogram and opening controls were ready | Previous build | Optimized build |
| --- | ---: | ---: |
| Time | 43.9 s | 2.5 s |
| Transferred site data | 4.22 MB | 0.20 MB |

These are controlled local measurements, rather than a guarantee for every device or network. Separate browser checks also held font requests indefinitely, stalled video, verified the film on data-saving connections and manual replay, and simulated a failed secondary-code download followed by successful automatic retry.

Measure the built website with the cache disabled and record the connection, viewport and CPU throttle used. Useful checks include the time until the envelope image and seal are ready, bytes transferred before the first tap, and the requests made before opening the invitation or reaching the guestbook.

Also check blocked font requests, delayed or blocked video, an early seal tap with music, Urdu switching, reduced motion, manual replay, direct section links, interrupted secondary-code loading and wish drafts. Actual opening times depend on the connection and device; the media sizes above are file measurements.
