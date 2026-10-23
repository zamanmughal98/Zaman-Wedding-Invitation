# Wedding film integration plan

Recommendation: use the film once as a short opening sequence, immediately after the guest taps the envelope's wax seal and before the main invitation appears.

Implemented as a local trial on 23 October 2026. The film, skip/pause controls, shared music control and footer replay are now part of the source. This trial has not been deployed.

## What happens in the video

The supplied `IMG_7283.MOV` is 10.10 seconds long, 1920 x 1078 pixels, 30 fps, and 18.09 MB. It contains H.264 video and an AAC audio track. The following description concerns the visible action; the soundtrack has not been identified.

| Approximate time | Visible action |
| --- | --- |
| 0:00-0:04.6 | A bride in a red, gold-embroidered outfit and a groom in a dark traditional outfit walk toward each other from opposite sides of a decorated hall. |
| 0:04.6-around 0:06 | A closer view shows them facing one another and exchanging a look. |
| Around 0:06-0:08.3 | The views change as they approach the raised stage, turn, and sit together on its sofa. |
| 0:08.3-0:10.1 | A closer, front-facing seated portrait closes the sequence. |

Cream drapery, warm lighting, gold arches, white flowers and green cushions suit the website's warm paper, brown lettering and floral details. The film tells a compact story of two people coming together. Its seated ending gives the invitation a natural point of entry.

The opening and ending have different compositions. Repeating the whole clip would produce a visible jump from the seated portrait to the couple standing apart.

## Exact place and timing

Current flow:

`Envelope -> tap the wax seal -> wedding film -> names and invitation -> countdown and other sections`

The seal tap replaces the intermediate letter and its separate "Enter the celebration" action with this opening sequence. This keeps the main opening to one tap.

| Moment | Behaviour |
| --- | --- |
| Page opens | Display the existing envelope immediately. Keep the film from delaying that first view. |
| Guest taps the seal | Start the existing music according to the guest's sound preference. Animate the envelope away over roughly 0.5 seconds. |
| Envelope clears | Start the film from its beginning. Keep "Skip to invitation" visible throughout. |
| Film reaches its final portrait | Briefly hold the final frame, then fade into the existing invitation over roughly 0.5 seconds. Trigger this from the video's `ended` event. |
| Invitation appears | Move keyboard focus to the invitation heading. The guest can scroll normally. |

Every seal tap can play the film again. Refreshing in the same tab, including while viewing another section, presents the envelope and film again. There is no session-storage restriction. Initial direct links to Celebrations, Photos and Wishes bypass the intro. The footer also provides a direct "Replay our opening film" action.

## Presentation and sound

- Let the scene span the opening, with no frame, border, card or player box. Fade its upper and lower edges into the invitation's paper background.
- Preserve the full approach on phones, then gently move closer after the couple meet. Keep both people visible.
- Place the names quietly near the top, away from faces, and group playback controls along the bottom. A fine progress line indicates playback.
- Use a still from the beginning as the loading poster. The final seated portrait can illustrate the optional replay control.
- Play the film silently and let the existing Samjhawan track continue according to the sound control. Keep a single soundtrack throughout the opening.
- Keep skip and pause controls visible and accessible. A user who pauses the film should be able to continue directly to the invitation.

## Loading and accessibility

Prepare the small film in the background after the priority envelope image has loaded. Guests should still be able to open the invitation immediately. For data-saving connections, defer the film request until the seal tap.

If the film cannot start within 1.5 seconds, proceed to the invitation. A stalled or failed film must also leave the skip control working. Playback rejection is handled explicitly. Use inline playback on phones.

For reduced-motion preferences, bypass the automatic opening film and reveal the invitation after the seal tap. Leave the replay link available for deliberate playback. Pause playback when the page is hidden.

Browser behaviour references: [MDN video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) and [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).

## Implementation in this project

The existing `invitation.heroVideo` setting is empty. Its renderer in `src/components/hero.js` places video beneath the names, and `src/features/media.js` starts playback during page initialisation and loops it. That behaviour would allow the film to begin behind the envelope and would repeat the ending-to-opening jump.

The film is implemented within the envelope flow in `src/components/envelope.js` and `src/features/invitation.js`, with its layout in `styles/opening-film.css`. Both music controls share playback state through `src/features/music.js`. Its source and poster are configured under `envelope.film`; the optional `heroVideo` remains separate. The main invitation and section order remain as configured.

Local Chrome verification covers the seal-to-film transition, skip, pause, completion, repeat playback after refresh from another section, keyboard focus, direct section links, reduced motion, slow or failed loading, visibility handling, shared sound controls, denied storage and five viewport sizes. The 42 project tests also pass. Physical iPhone/Safari playback has not been checked.

## Prepared local review assets

These files are in the ignored `.preview/video-analysis/` directory and are not published:

- `wedding-film-web-preview.mp4`: silent H.264 MP4, 1280 x 718 pixels, 30 fps, 10.10 seconds, 1.67 MB; approximately 91% smaller than the original. Includes fast-start metadata.
- `opening-poster.jpg`: still from the beginning for the proposed loading poster.
- `ending-poster.jpg`: final seated portrait for a possible replay image.
- `contact-sheet.jpg` and `timeline.jpg`: sampled frames used for visual analysis.

The preview decoded through all 303 frames. Local Chrome playback and the implemented interaction have been checked. The original MOV is unchanged.
