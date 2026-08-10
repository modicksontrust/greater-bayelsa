---
name: SVG logos via <img>
description: Why logo.svg embeds the JPEG as a base64 data URI
---
Rule: any SVG loaded through `<img src>` (or as a Clerk `logoImageUrl`) must be self-contained — browsers block external resource loads (`<image href="file.jpg">`) inside image-context SVGs, rendering them blank.

**Why:** the platform logo.svg originally referenced logo.jpg relatively and showed as an empty/solid square in the nav and Clerk pages.

**How to apply:** when wrapping a raster logo in SVG, base64-embed it (`data:image/jpeg;base64,...`). Regenerate with `base64 -w0 logo.jpg` if the logo file changes.
