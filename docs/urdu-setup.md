# Guest English / Urdu

The invitation has English / اردو buttons on the envelope and in the header. Choice is remembered on that browser; `?lang=ur` opens Urdu directly, including with a section hash. Switching preserves the main page's film, music, scratch state and open dialogs. The embedded guestbook reloads into the chosen language; its existing input-draft storage preserves typed wishes. All dates, links and event IDs use the existing wedding configuration.

Fixed copy is authored in `config/urdu.js` and `config/urdu-photos.js`, with right-to-left layout and Urdu fonts. It is not sent to a translator. After changing those files or `src/localization.js`, run `npm run sync:locales` to regenerate standalone Apps Script guest bundles. Publish the website using the existing GitHub Pages process after review.

## Activate the public wishes page

1. Open the **existing wishes Apps Script project**, keeping its Sheet, Script Properties and deployment URL.
2. Replace **Code.gs** and **Index.html** with the versions in `backend/google-wishes/`.
3. Add Script files named **Translations** and **Reactions**, and paste `Translations.gs` and `Reactions.gs` respectively; add an HTML file named **GuestLocale** and paste `GuestLocale.html`.
4. Show `appsscript.json` in Project Settings and replace it with the supplied manifest. It adds `script.external_request` for the translation API; retain the existing Sheets, email and account scopes.
5. In **Project Settings → Script Properties**, add:

| Property | Value |
| --- | --- |
| `GEMINI_API_KEY` | Your own Gemini API key; never paste it into GitHub, website config or a public URL. |
| `WISH_TRANSLATION_MODEL` | An available text model ID from [Google's model list](https://ai.google.dev/gemini-api/docs/models), supporting `generateContent`, e.g. the exact Flash-Lite model ID shown in your AI Studio account. Do not include `models/`. |
| `WISH_TRANSLATION_DAILY_LIMIT` | Optional; `100` by default. Counts attempted API calls, including failures, per UTC day. This is separate from the email quota. |

6. Run **initializeWeddingWishes** in the editor to authorize the updated scopes. This preserves existing wishes and the current moderator key. Do not renew the key or create a new Sheet.
7. **Deploy → Manage deployments → Edit (pencil) → New version → Deploy** on the current deployment. Keep **Execute as: you**, **Who has access: Anyone**. The existing `/exec` URL remains in use.
8. Open that URL with `?view=wall&lang=ur`. Check the Urdu form and an approved wish. Every wish has **اصل / English / اردو** controls, including messages already written in Urdu. Open `?view=wall&lang=en` and check **Original / English / اردو** on English, Urdu and Roman Urdu messages. The page language supplies the initial message view; guests can choose either message language independently. Your private moderation page remains in English.

Obtain a key through [Google AI Studio](https://aistudio.google.com/apikey) and check [API pricing and data-use terms](https://ai.google.dev/gemini-api/docs/pricing) before enabling it. When configured, only approved message text is sent to Google for translation on demand; author names, pending wishes and private moderation details are not sent. Consider a paid API project if its data-use terms better fit your preference. No provider request was made during local automated testing.

Every approved wish has **Original / English / اردو** controls. This includes an English original on the English page and an Urdu original on the Urdu page. The controls remain available when a translation equals the original; the label then says **Original message**. English and Urdu can be chosen without changing the page or form language. The selected message view survives wall refreshes while that guestbook page stays open, including after an original-text edit.

Without an API key/model, both interfaces work and wishes remain readable in their original language. Translation failure, an exhausted cap or a provider refusal also leaves the original visible with a short explanation; Original remains usable while either translation loads. Existing Urdu-script messages without Latin text are immediately available as Urdu without an API request. The service is instructed to return already-English messages exactly as written. The single daily API cap is shared across English and Urdu requests, including first-time English language detection/translation. Cached versions are reused when guests switch message languages.

## Update an existing English/Urdu wishes installation

The universal message controls affect only the public wishes module. Replace **Code.gs**, **Index.html** and **Translations.gs** in the existing **wishes** Apps Script project with their current versions in `backend/google-wishes/`. Add a Script file named **Reactions** containing `Reactions.gs`, or replace it if already present. Save, then update the **existing deployment** using **Deploy → Manage deployments → Edit → New version → Deploy**. Keep your current key, model, manifest, GuestLocale file and other Script Properties. No initialization, new API key, photo-uploader update or website-code deployment is required for this addition.

The public wall also supports shared reactions and one wish pinned by its exact author name. See [the reactions and pinning update steps](google-wishes-setup.md#add-shared-reactions-and-one-pinned-wish) for deployment and verification. These controls work in both interface languages.

Test the public URL with `?view=wall&lang=en`. Check an English original: it should have all three controls and translate into Urdu when Urdu is chosen. Check Urdu and Roman Urdu originals in both languages. Then use `?view=wall&lang=ur` and verify an Urdu original can be viewed in English too. Choose Original while a translation loads, and confirm the late result does not replace that choice. Refresh wishes and confirm the selected message language stays selected. Translations are generated on demand and reused across visitors; originals stay available if the API cannot finish.

## Editing messages

Continue editing only the original message. The backend fingerprints its exact current text, configured model and language-specific translation prompt. An old translation is used only if its fingerprint matches the requested language and current text. A direct Sheet edit is detected even if the approval revision was not changed. Both language versions regenerate lazily when viewed; existing approved wishes use the same flow, so no manual backfill is needed.

Urdu translations continue using **WishTranslations**; English uses a separate **WishTranslationsEnglish** tab created automatically on its first API request. Existing Urdu rows and fingerprints are preserved. Keep both tabs private. The **Wishes** tab and moderation workflow are unchanged. Overlapping visitors share a reservation for each language; failures wait ten minutes before another attempt. A message edited or hidden during the API request is checked again before any generated text is returned. Pending, rejected and hidden wishes cannot be translated through either public endpoint. Public wall refreshes continue on their existing 30-second/visibility schedule; currently open pages learn moderation changes on their next refresh.

## Activate the separate photo uploader

The uploader is the separate **Zaman & Nimra Wedding Photos** project. The deployed project uses a **combined Code.gs** containing its HTML, so seeing only Code.gs and appsscript.json is expected. Its editable source remains private in `.local/google-photos/`; no credentials or private upload data are copied into the public site.

`npm run sync:locales` regenerates the GuestLocale resources and, when the prepared private source is present, **`.preview/google-photos/Code.gs`** with all five HTML resources. The generator does not migrate or rewrite the private source. This generated combined file is the one to paste into Google; `.local/google-photos/Code.gs` alone is only the modular server source and is insufficient.

1. Open the existing **Zaman & Nimra Wedding Photos** Apps Script project.
2. Replace the **entire contents of Code.gs** with `.preview/google-photos/Code.gs`. Do not add separate HTML files to this combined-file installation.
3. Save. Keep the existing appsscript.json, Script Properties, Drive folders and ledger. No Gemini key or rerun of initializeWeddingPhotos is needed.
4. Update the current deployment: **Deploy → Manage deployments → Edit → Version: New version → Deploy**. Keep **Execute as: Me**, **Who has access: Anyone**, and the existing deployment URL.
5. Open `/exec?lang=ur`, check the Urdu page, then test a name, event selection and a small upload. The existing upload rules are unchanged.

If maintaining a separate installation that already uses individual HTML files, the modular source changes are:

1. Change `function doGet()` to `function doGet(e)` and insert `config.language = e && e.parameter && e.parameter.lang === 'ur' ? 'ur' : 'en';` immediately before assigning `page.pageConfig`.
2. Add `'GuestLocale'` to the allowed resource names in `photoInclude_`.
3. In Index.html insert `<?!= photoInclude_('GuestLocale') ?>` immediately before the Hash include, after `const CONFIG = ...` has been defined. Add the generated GuestLocale HTML file.
4. In Client.html, replace the `destination.textContent = eventLabel(item) + ' · ' + (item.guest || 'Guest');` line with a text node for `eventLabel(item) + ' · '` and a separate `bdi` element for the guest name, marked `data-user-content`. The prepared local Client.html shows the complete version. Filenames are excluded from translation by the shared localizer.

## Local validation

`npm test` tests source-text changes, repeated calls, in-flight edits/hiding, missing keys, provider failure and the daily cap with local fakes. `npm run build` packages only public website assets; translation backend files and keys are excluded. Browser QA should cover both languages at small phone and desktop widths, language persistence, film/scratch state, mixed-direction names and the original-message control. Live API quality/latency and real Apps Script deployments require your own account configuration and review.
