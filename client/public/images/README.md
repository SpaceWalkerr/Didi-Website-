# Images

Drop replacements in this folder **using the same filenames** — nothing in the code needs to change.

| File | Size | Where it shows | Status |
| --- | --- | --- | --- |
| `doctor-photo.jpg` | 1000 × 1250 (4:5 portrait) | Home hero and About page | ✅ Real photo in place |
| `about.jpeg` | 827 × 827 (1:1 square) | Beside "Qualifications & training" on the About page | ✅ Convocation photo in place |
| `og-image.jpg` | 1200 × 630 | Link preview when the site is shared on WhatsApp, Facebook, LinkedIn | Usable as-is; replace if you want a photo version |
| `apple-touch-icon.png` | 180 × 180 | Icon when a patient adds the site to their phone's home screen | Usable as-is |
| `../favicon.svg` | square | Browser tab icon | Usable as-is |

## Doctor photograph

Dr. Rani's photograph is in place, cropped to 4:5 and compressed to ~130 KB.

**If you replace it**, keep these in mind — the previous version was a 3.9 MB PNG, which would have
taken many seconds to load on a patient's mobile data:

- **Crop to 4:5 portrait** (e.g. 1000 × 1250). The site crops to fill, so any other ratio gets its
  top and bottom trimmed.
- Head and shoulders, eyes roughly a third from the top, plain or softly blurred background.
- **Save as JPG**, not PNG — PNG is for graphics and logos; for a photograph it is several times
  larger at the same quality. Aim for 85% quality and under ~300 KB.
- Name it exactly `doctor-photo.jpg`.

If you would rather use a different filename or format, change `photoUrl` in
[`client/src/config.js`](../../src/config.js). Setting `photoUrl` to an empty string falls back to a
built-in illustrated placeholder instead.

## Convocation photo (`about.jpeg`)

Sits next to the qualifications list on the About page, where it backs up what that list claims.
It is cropped square, so use a **1:1 image** if you swap it — anything else gets trimmed top and
bottom. Set `gradPhotoUrl` to `''` in [`client/src/config.js`](../../src/config.js) to hide it.

The alt text describes the photo for screen readers and is translated in every language
(`about.gradPhotoAlt` in `client/src/i18n/`). Update it there if you change the image.

## Link preview (`og-image.jpg`)

This is what patients see when the link is forwarded on WhatsApp, so it is worth getting right. The
current version is a clean branded card with the doctor's name, qualification and registration
number — fine to ship. If you replace it, keep text well inside the edges, since WhatsApp crops the
preview differently across devices.

After deploying, set `og:url` to the real domain in [`client/index.html`](../../index.html) and test
the preview by sending the link to yourself.
