/* WRI organization logos: the one list of which logo belongs to which organization.

   name     display name shown on charts
   type     Contractor | Railroad | Agency | (blank)
   aliases  other spellings people type, separated by |  (matching is done by resolveOrg_ in chart.js)
   file     PNG in this folder, standardised to 324 x 216 by logo-prep.html; blank = no logo yet (monogram tile)
   updated  date the file last changed; used as ?v= so browsers fetch the new image

   Edit with logo-prep.html, which rewrites this file. One organization per line, sorted by name.
   Not a browser page? Remove this comment, the assignment at the start of the next line and the
   final semicolon; what is left is plain JSON. */
window.WRI_ORGS = [
  {"name":"Arcadis","type":"Contractor","aliases":"","file":"arcadis.png","updated":"2026-11-17"},
  {"name":"BLM","type":"Agency","aliases":"Bureau of Land Management","file":"blm.png","updated":"2026-11-17"},
  {"name":"BNSF Railway","type":"Railroad","aliases":"BNSF","file":"bnsf.png","updated":"2026-11-17"},
  {"name":"Clean Harbors","type":"Contractor","aliases":"","file":"clean-harbors.png","updated":"2026-11-17"},
  {"name":"EMSI","type":"Contractor","aliases":"","file":"emsi.png","updated":"2026-11-17"},
  {"name":"EPA","type":"Agency","aliases":"US EPA","file":"epa.png","updated":"2026-11-17"},
  {"name":"GHD","type":"Contractor","aliases":"","file":"ghd.png","updated":"2026-11-17"},
  {"name":"Graymar","type":"Contractor","aliases":"Graymar Environmental","file":"graymar.png","updated":"2026-11-17"},
  {"name":"HMR","type":"Contractor","aliases":"Haz-Mat Response","file":"hmr.png","updated":"2026-11-17"},
  {"name":"Minnesota Environmental Quality Board","type":"Agency","aliases":"MNEQB|MN EQB|EQB","file":"mn-eqb.png","updated":"2026-11-17"},
  {"name":"Minnesota Pollution Control Agency","type":"Agency","aliases":"MNPCA|MN PCA|MPCA","file":"mn-pca.png","updated":"2026-11-17"},
  {"name":"MSRC","type":"Contractor","aliases":"","file":"msrc.png","updated":"2026-11-17"},
  {"name":"Onterris","type":"Contractor","aliases":"CTEH","file":"onterris.png","updated":"2026-11-17"},
  {"name":"OSPR","type":"Agency","aliases":"CDFW OSPR","file":"ospr.png","updated":"2026-11-17"},
  {"name":"OTS","type":"Contractor","aliases":"Olympus Technical Services","file":"ots.png","updated":"2026-11-17"},
  {"name":"Republic Services","type":"Contractor","aliases":"","file":"republic-services.png","updated":"2026-11-17"},
  {"name":"RIO Environmental","type":"Contractor","aliases":"RIO|RIO Environmental Consultants","file":"rio.png","updated":"2026-11-17"},
  {"name":"TRG","type":"Contractor","aliases":"","file":"trg.png","updated":"2026-11-17"},
  {"name":"Union Pacific","type":"Railroad","aliases":"UP|UPRR","file":"union-pacific.png","updated":"2026-11-17"},
  {"name":"USFS","type":"Agency","aliases":"US Forest Service|Forest Service","file":"usfs.png","updated":"2026-11-17"},
  {"name":"Washington Ecology","type":"Agency","aliases":"WA Ecology|Dept of Ecology|WDOE","file":"wa-ecology.png","updated":"2026-11-17"},
  {"name":"WRI","type":"Contractor","aliases":"Whitewater Rescue Institute|Whitewater Rescue","file":"wri.png","updated":"2026-11-17"}
];
