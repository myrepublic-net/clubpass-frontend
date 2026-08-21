Pick-up point photos for the member dashboard bottom sheet.

Expected filenames (see src/data/homeExpress.js):
  mbs.jpg  celavi.jpg  clarke-quay.jpg  boat-quay.jpg  zouk.jpg

Landscape, roughly 3:2, ~1200px wide is plenty — they render 180px tall.
A missing file is handled: the sheet shows a plain panel instead of a broken
image, so the dashboard works before the photos arrive.
