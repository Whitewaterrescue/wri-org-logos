# WRI organization logos

Logos of the organizations WRI works alongside on incidents, standardised for
the ICS organization chart, plus the one list that says which logo belongs to
which organization.

Served as plain web files: `https://whitewaterrescue.github.io/wri-org-logos/`

| File | What it is |
|---|---|
| `logos.js` | The list: `window.WRI_ORGS = [ {name, type, aliases, file, updated} ]` |
| `<name>.png` | Standardised logo: 324 × 216 px, transparent, trimmed and centered |
| `originals/` | The untouched source image for each logo, so any of them can be redone |
| `index.html`, `logo-prep.js` | Logo Prep, the page used to add or replace a logo |

## Using the logos

In a web page:

```html
<script src="https://whitewaterrescue.github.io/wri-org-logos/logos.js"></script>
<!-- window.WRI_ORGS is now the list; an organization's image is base + entry.file -->
```

Append `?v=` + the entry's `updated` date to the image address so browsers
fetch a replaced logo instead of a cached one.

Not a browser page (Apps Script, a script)? Fetch `logos.js`, remove the
leading comment, the `window.WRI_ORGS =` prefix and the final semicolon; what
is left is plain JSON.

Free-text organization names are matched to this list by `resolveOrg_()` in
the org chart engine: exact name, then normalised name, then `aliases`, then a
deliberately conservative prefix match. A wrong logo on an incident document is
worse than no logo, so short acronyms match only exactly or through an alias.

## Adding or replacing a logo

Open Logo Prep — `index.html` in your copy of this repo, or the address above.

1. Drop, choose or paste (Ctrl+V) an image: PNG, JPG, WebP or SVG. Use the
   largest, cleanest version you can find, ideally from the organization's own
   site or brand page.
2. Empty margin is trimmed automatically. For a long wordmark, drag a box
   around just the emblem.
3. Check the real-size preview and any warnings (too wide, low resolution,
   over 400 KB).
4. Enter the display name, type and the other spellings people type. An
   existing name updates that entry; a new name adds one.
5. Save. With the repo folder connected (Chrome or Edge) it writes the PNG, a
   copy of the original into `originals/`, and the rewritten `logos.js`.
   Otherwise it downloads the PNG and `logos.js` to move in by hand.
6. Commit and push. The site updates a minute or so later.

Logo Prep runs entirely in the browser. Nothing is uploaded.

## Notes

- PNG only. SVG logos are converted on the way in; some downstream uses
  (generated documents) cannot embed SVG.
- Keep files under 400 KB.
- These are other organizations' trademarks, used here only to identify them
  on incident organization charts. Agency seals in particular often have usage
  rules; check the organization's guidance before adding one.
