# Opening wedding film

`wedding-opening.mp4` is the web version of the supplied `IMG_7283.MOV`: 10.10 seconds, H.264, 1280 x 718 pixels, 30 fps, 1.67 MB. It has no audio track; the invitation's existing music supplies the soundtrack. Fast-start metadata lets playback begin before the whole file is downloaded.

`wedding-opening-light.mp4` is the compact version: the same full 10.10 seconds at 30 fps, H.264/yuv420p, 854 × 480 pixels, approximately 746 kB. It also has fast-start metadata and no audio track. The original web version remains available for larger displays on faster connections.

`wedding-opening-poster.jpg` is its opening frame. The scene spans the opening without a frame or player box, with the upper and lower edges fading into the invitation paper. On phones the full approach is shown first, followed by a gentle closer view after the couple meet.

The film is configured under `envelope.film` in `config/wedding.js`: `src` selects the original web version, `lightSrc` selects the compact version, and `poster` selects the opening still. Phones and reported slower connections use the compact version. Other larger displays use the original web version.

The film plays after the wax seal, with skip and pause controls. Slow and data-saving connections wait for playback rather than skipping the film. A loading or buffering message stays visible while needed; failed playback offers a retry. Reduced motion removes the transition and zoom. Guests can choose Skip or the footer replay link. Speculative film downloading is limited to reported fast connections. Skipping an unfinished film releases its source once the intro closes so downloading can stop.

The opening can play again on every seal tap and page refresh in the same tab; playback does not depend on session storage. Initial direct section links bypass the envelope, while refreshing a section presents the opening again. Finishing the opening reveals the top of the invitation.

The source MOV and review assets remain outside the public build. This directory's Markdown notes are also excluded from the build.
