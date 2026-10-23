# Opening wedding film

`wedding-opening.mp4` is the web version of the supplied `IMG_7283.MOV`: 10.10 seconds, H.264, 1280 x 718 pixels, 30 fps, 1.67 MB. It has no audio track; the invitation's existing music supplies the soundtrack. Fast-start metadata lets playback begin before the whole file is downloaded.

`wedding-opening-poster.jpg` is its opening frame. The scene spans the opening without a frame or player box, with the upper and lower edges fading into the invitation paper. On phones the full approach is shown first, followed by a gentle closer view after the couple meet.

The film is configured under `envelope.film` in `config/wedding.js`. It plays after the wax seal, with skip and pause controls. It can play again on every seal tap and page refresh in the same tab; playback does not depend on session storage. The footer also offers a direct replay link. Initial direct section links bypass the envelope, while refreshing a section presents the opening again. Finishing the opening reveals the top of the invitation.

The source MOV and review assets remain outside the public build. This directory's Markdown notes are also excluded from the build.
