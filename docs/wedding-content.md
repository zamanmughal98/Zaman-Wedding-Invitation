# Confirmed wedding content

The printed reception card and Zaman's latest schedule are the sources for public invitation content. The leave-plan message is contextual only; work dates, manager details, and other family weddings are not invitation content.

- Groom: **Zaman Mughal**
- Bride: **Nimra Shafiq**, daughter of **Mr. & Mrs. Shafiq**
- Hosts: **Mr. & Mrs. Ishfaq Mughal**
- Main text: **#4c3228**
- Supporting text: **#5b3e31**
- 12 November 2026, Thursday: **Nimra's Mehndi**, evening, **Zaraat Colony, near University of Education, Attock Campus, Attock City**
- 13 November 2026, Friday: **Zaman's Mehndi**, evening, **Masha Allah Marriage Hall, Attock City**
- 14 November 2026, Saturday: **Nikah & Barat**, combined evening function, **Zamzama Marriage Hall, Attock Cantt**
- 15 November 2026, Sunday: **Walima reception**, **7:00 PM**
- Walima venue: **Royal Vista Event Complex, Attock City**
- Printed contact: **Zaighum Mughal - 0349 0095926**

Still to confirm: exact start times for the first three functions, any end times, clothing preferences, additional family wording, personal photos, and the friend's animation file.

The first three functions show evening/time to follow. Their calendar downloads include the confirmed venues and save the dates without inventing a start time. The countdown uses the confirmed Walima start. No fictional times, venue names, biographies, or story milestones are supplied.

The four event cards share engraved corner frames, paper grain, tonal shading, an ornamental crest, cream lettering, and subtle watermarks taken from their existing Urdu event labels. Nimra's Mehndi uses olive green (tone: olive), Zaman's Mehndi dark green (tone: green), Nikah & Barat muted red (tone: red), and Walima chocolate brown (tone: brown). Set event.tone in config/wedding.js; the paper and text colours live in styles/theme.css. Surrounding sections use ivory, linen, and deeper parchment with a fine paper grain. Pointed arch outlines, folded-corner details, and flowing border flourishes echo the printed invitation. The narrow side flourishes continue down each section, including the full four-card celebration section; matching ornaments bridge the event cards. The hero surround uses deeper parchment while its foreground card is retained. The main text area stays clear of the border artwork. The original heading fonts, sizes, colours, ornaments, and approved left alignment remain. Surface colours and decoration strength are controlled by --section-* tokens in styles/theme.css; mapping is near the top of styles/stationery.css. Linen backgrounds also cover the hero, portraits, gallery placeholder, venue, photo-sharing panel, and form fields. Panel and field colours use --panel-* and --field-* tokens. Guestbook colours use --guestbook-* tokens, mirrored in the public-only CSS of backend/google-wishes/Index.html. The Google approval, storage, and submission logic is unchanged. Decorations cannot intercept taps and are hidden when printing.

The animation is an optional asset: set invitation.heroVideo and optionally heroVideoPoster in config/wedding.js. A personal photo remains an alternative through heroPhoto. The opening envelope is preserved.

Optional sections remain in the project. Story is disabled until there is a real story to add; gallery has an honest empty state. Attendance replies and their navigation link are hidden for the close-family invitation. The couple cards use matching two-line names and portrait frames ready for childhood photos. Every section can be hidden or restored through configuration.
