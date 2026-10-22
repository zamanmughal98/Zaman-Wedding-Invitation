`ivory-envelope.png` is original artwork generated with the built-in imagegen tool for this project. The monogram is a separate overlay, not baked into the envelope artwork.

Prompt: Front-facing portrait 2:3 closed wedding envelope, textured ivory cotton paper (#faf6ef), warm cream (#f2ead9), fine antique gold (#b08d57) double border, embossed ivory jasmine flowers and gold leaves at the top right and bottom left, folded flaps meeting in the middle, blank round ivory wax seal with gold inner rim centered at 50%/50%. Fill the canvas with the envelope, no perspective tilt, no props, no text, no letters, no logos, no watermark. Tactile embossed stationery in soft light.

`zaman-nimra-monogram.png` is the transparent PNG logo supplied by the couple. Set `site.logo` in `config/wedding.js` to replace it across the header, envelope seal, footer, browser-tab icon, and optional RSVP seal. Set it to `null` to use text initials and the generic fallback tab icon. Its original colours and transparency are preserved.

Architectural and botanical illustrations are original SVG code in `src/components/artwork.js`. Section ornaments and the fine paper grain are in `assets/ornaments/`; their colours and strength are controlled from the theme.

`zaman-childhood.jpg`, `nimra-childhood.jpg`, and `zaman-nimra-childhood.jpg` are the three childhood photographs supplied by the couple on 22 October 2026. They are original JPEG copies, with no retouching. The individual photos fill the existing arched portraits (crop controlled by `couple.*.photoPosition`); the shared photo is shown uncropped in the gallery, with tap-to-enlarge viewing. Replace their paths and alt text in `config/wedding.js`.

The optional opening image uses `invitation.heroPhoto` and `heroPhotoPosition`. An animation uses `invitation.heroVideo` with an optional `heroVideoPoster`; place the video in `assets/videos/` and its poster in `assets/images/`. Gallery entries use `src`, `alt`, `caption`, and `position`. Missing personal photographs retain their initials or an illustrated fallback.
