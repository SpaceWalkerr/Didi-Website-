# Images

Drop replacements in this folder **using the same filenames** — nothing in the code needs to change.

| File | Size | Where it shows | Status |
| --- | --- | --- | --- |
| `doctor-photo.jpg` | 800 × 1000 (4:5 portrait) | Home hero and About page | **Placeholder — must be replaced** |
| `og-image.jpg` | 1200 × 630 | Link preview when the site is shared on WhatsApp, Facebook, LinkedIn | Usable as-is; replace if you want a photo version |
| `apple-touch-icon.png` | 180 × 180 | Icon when a patient adds the site to their phone's home screen | Usable as-is |
| `../favicon.svg` | square | Browser tab icon | Usable as-is |

## Doctor photograph

The one image that genuinely needs replacing. The current file is a visibly unfinished placeholder
so it cannot be mistaken for a real photo.

- **Crop to 4:5 portrait** (e.g. 800 × 1000 or 1200 × 1500). The site crops to fill, so any other
  ratio will have its top and bottom trimmed.
- Head and shoulders, eyes roughly a third from the top, plain or softly blurred background.
- Save as JPG at around 85% quality and keep it under ~300 KB — many patients will load this on
  mobile data.
- Name it exactly `doctor-photo.jpg`.

If you would rather use a different filename or format, change `photoUrl` in
[`client/src/config.js`](../../src/config.js). Setting `photoUrl` to an empty string falls back to a
built-in illustrated placeholder instead.

## Link preview (`og-image.jpg`)

This is what patients see when the link is forwarded on WhatsApp, so it is worth getting right. The
current version is a clean branded card with the doctor's name, qualification and registration
number — fine to ship. If you replace it, keep text well inside the edges, since WhatsApp crops the
preview differently across devices.

After deploying, set `og:url` to the real domain in [`client/index.html`](../../index.html) and test
the preview by sending the link to yourself.
