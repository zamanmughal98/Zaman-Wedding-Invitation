`ivory-envelope.png` is original artwork generated with the built-in imagegen tool for this project. The monogram is a separate overlay, not baked into the envelope artwork.

Prompt: Front-facing portrait 2:3 closed wedding envelope, textured ivory cotton paper (#faf6ef), warm cream (#f2ead9), fine antique gold (#b08d57) double border, embossed ivory jasmine flowers and gold leaves at the top right and bottom left, folded flaps meeting in the middle, blank round ivory wax seal with gold inner rim centered at 50%/50%. Fill the canvas with the envelope, no perspective tilt, no props, no text, no letters, no logos, no watermark. Tactile embossed stationery in soft light.

`zaman-nimra-monogram.webp` is the compact version of the transparent logo supplied by the couple. Set `site.logo` in `config/wedding.js` to replace it across the header, envelope seal, footer and browser-tab icon. Set it to `null` to use text initials and the generic fallback tab icon. Its original colours and transparency are preserved. The unused 1.06 MB PNG copy was removed from the website assets.

The envelope PNG remains the social-sharing image. Smaller WebP versions are selected in `config/wedding.js` for normal website loading:

| File | Dimensions | Approximate size |
| --- | --- | --- |
| `ivory-envelope.webp` | 1024 × 1536 | 214 kB |
| `ivory-envelope-768.webp` | 768 × 1152 | 128 kB |
| `ivory-envelope-512.webp` | 512 × 768 | 58 kB |
| `zaman-nimra-monogram.webp` | 256 × 256 | 27 kB |

`envelope.image`, `imageSources` and `imageSizes` provide the responsive envelope choices; the browser chooses a suitable image for its display. `site.logo` selects the compact monogram. The envelope variants retain the original artwork, and the monogram retains its transparency. These replace the roughly 3.08 MB envelope PNG and 1.06 MB logo PNG in normal page requests.

Architectural and botanical illustrations are original SVG code in `src/components/artwork.js`. Section ornaments and the fine paper grain are in `assets/ornaments/`; their colours and strength are controlled from the theme.

`zaman-childhood.jpg`, `nimra-childhood.jpg`, and `zaman-nimra-childhood.jpg` are the three childhood photographs supplied by the couple on 22 October 2026. They are original JPEG copies, with no retouching. The individual photos fill the existing arched portraits (crop controlled by `couple.*.photoPosition`); the shared photo is shown uncropped in the gallery, with tap-to-enlarge viewing. Replace their paths and alt text in `config/wedding.js`.

The optional opening image uses `invitation.heroPhoto` and `heroPhotoPosition`. An animation uses `invitation.heroVideo` with an optional `heroVideoPoster`; place the video in `assets/videos/` and its poster in `assets/images/`. Gallery entries use `src`, `alt`, `caption`, and `position`. Missing personal photographs retain their initials or an illustrated fallback.
