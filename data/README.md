# Approved wishes JSON

For phone-based moderation, use the prepared [Google wishes app](../docs/google-wishes-setup.md). Once it is connected, you approve or hide messages from your private phone link, without editing this file or redeploying.

**Download approved JSON** in the moderation page exports a backup in this format:

```json
[
  {
    "name": "Guest name",
    "message": "Their approved wish."
  }
]
```

While wishes.googleScriptUrl is empty, data/wishes.json is the manual public wall. Review a received message, add only its name and approved wish, and deploy through GitHub Pages. Do not add phone numbers, emails, private attendance records, or moderation keys. Keep [] when there are no approved messages.

When Google mode is enabled, this file is not merged into the live wall. That prevents an old JSON copy from restoring a wish you hid on your phone.
