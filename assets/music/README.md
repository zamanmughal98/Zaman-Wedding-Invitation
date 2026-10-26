# Background music

`samjhawan-unplugged-light.m4a` is the website version of the Samjhawan track supplied by Zaman on 22 October 2026. Its path, soft level, and envelope-start behaviour are set in `config/wedding.js` under `music`. No player or third-party music service is embedded.

The M4A is approximately 1.87 MB, AAC-LC at 96 kbps, 48 kHz stereo, with the full 154-second track. Its MP4 container has fast-start metadata for streaming. The encoding keeps the original volume; the configured player volume supplies the soft background level. The unused 6.17 MB MP3 was removed from the website assets.

Music loads after an invitation or sound-button tap. Replacing the file or changing playback behaviour uses the same `music` configuration.
