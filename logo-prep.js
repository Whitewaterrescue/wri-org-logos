/* Logo prep (index.html): turn any logo image into the standard tile PNG
   and register it in logos.js.

   Runs entirely in the browser; nothing is uploaded anywhere. Reads PNG, JPG,
   WebP, GIF and SVG (dropped, chosen or pasted). When this repo's folder is
   connected (Chrome / Edge) it writes the PNG, a copy of the original and the
   updated logos.js straight into the folder; otherwise it downloads them.

   A tool for whoever maintains the logos, not part of the chart. ES5 syntax to
   match the repo, with promises where the browser APIs need them. */

var OUT_W = 324, OUT_H = 216, OUT_PAD = 10;     // 6x the chart's 54 x 36 tile
var MAX_BYTES = 400000;                         // same cap as ORG_LOGO_MAX_BYTES in Code.gs

var ORGS = (window.WRI_ORGS || []).map(function(o){ return { name: o.name, type: o.type || '', aliases: o.aliases || '', file: o.file || '', updated: o.updated || '' }; });
var SRC = document.createElement('canvas');     // the loaded image at working resolution
var OUT = document.createElement('canvas');     // the standardised result
OUT.width = OUT_W; OUT.height = OUT_H;
var ORIGINAL = null;      // { blob, name }
var WHITE_BG = false;     // image has an opaque white background rather than transparency
var TRIM = null;          // content bounds of the whole image
var SEL = null;           // what will be kept (source pixels)
var DIR = null;           // connected logos folder (File System Access API)
var VIEW_SCALE = 1;       // source pixels -> crop canvas pixels

function $(id){ return document.getElementById(id); }
function slugify(s){ return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function today(){ var d = new Date(), m = d.getMonth() + 1, x = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (x < 10 ? '0' : '') + x; }
function findOrg(name){
  var k = String(name || '').toLowerCase().replace(/^\s+|\s+$/g, ''), i;
  for (i = 0; i < ORGS.length; i++) { if (ORGS[i].name.toLowerCase() === k) return ORGS[i]; }
  return null;
}
function status(msg, kind){ var el = $('status'); el.textContent = msg; el.className = 'st' + (kind ? ' ' + kind : ''); }

/* ==== 1. load an image ==== */
function loadBlob(blob, name){
  if (!blob || !/^image\//.test(blob.type || '') && !/\.(svg|png|jpe?g|webp|gif)$/i.test(name || '')) { status('That is not an image file.', 'bad'); return; }
  var isSvg = /svg/.test(blob.type || '') || /\.svg$/i.test(name || '');
  var url = URL.createObjectURL(blob), img = new Image();
  img.onload = function(){
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) { w = 1600; h = 800; }                       // SVG with no stated size
    var longest = Math.max(w, h);
    var k = isSvg ? 1600 / longest : Math.min(1, 3000 / longest);   // vectors are rendered large; huge rasters are capped
    SRC.width = Math.max(1, Math.round(w * k)); SRC.height = Math.max(1, Math.round(h * k));
    var g = SRC.getContext('2d');
    g.clearRect(0, 0, SRC.width, SRC.height);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, SRC.width, SRC.height);
    URL.revokeObjectURL(url);
    ORIGINAL = { blob: blob, name: name || ('pasted.' + ((blob.type || 'image/png').split('/')[1] || 'png').replace('svg+xml', 'svg')), svg: isSvg, w: w, h: h };
    analyze();
    $('work').style.display = '';
    $('srcInfo').textContent = ORIGINAL.name + ' · ' + w + ' × ' + h + (isSvg ? ' (vector)' : '') + (WHITE_BG ? ' · white background' : ' · transparent background');
    if (!$('orgName').value) guessName(ORIGINAL.name);
    status('Image loaded. Adjust the box if you only want the emblem, then fill in the details.', '');
  };
  img.onerror = function(){ URL.revokeObjectURL(url); status('Could not read that image.', 'bad'); };
  img.src = url;
}
function guessName(file){
  var base = String(file).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s*\(\d+\)\s*$/, '').replace(/\blogo\b/ig, '').replace(/^\s+|\s+$/g, '');
  var hit = findOrg(base);
  if (!hit) { ORGS.forEach(function(o){ if (!hit && slugify(o.name) === slugify(base)) hit = o; if (!hit && o.file && o.file.replace(/\.png$/, '') === slugify(base)) hit = o; }); }
  $('orgName').value = hit ? hit.name : base;
  onNameChange();
}

/* Content bounds inside a rectangle of the source. Transparent pixels are
   empty; so are near-white ones when the image has a white background. */
function contentBounds(rect){
  var d = SRC.getContext('2d').getImageData(rect.x, rect.y, rect.w, rect.h).data;
  var l = rect.w, t = rect.h, r = -1, b = -1, x, y, i;
  for (y = 0; y < rect.h; y++) {
    for (x = 0; x < rect.w; x++) {
      i = (y * rect.w + x) * 4;
      if (d[i + 3] <= 12) continue;
      if (WHITE_BG && d[i] > 244 && d[i + 1] > 244 && d[i + 2] > 244) continue;
      if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y;
    }
  }
  if (r < 0) return null;
  return { x: rect.x + l, y: rect.y + t, w: r - l + 1, h: b - t + 1 };
}
function analyze(){
  var w = SRC.width, h = SRC.height, g = SRC.getContext('2d'), n = 0;
  [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].forEach(function(c){
    var p = g.getImageData(c[0], c[1], 1, 1).data;
    if (p[3] > 200 && p[0] > 244 && p[1] > 244 && p[2] > 244) n++;
  });
  WHITE_BG = n >= 3;
  TRIM = contentBounds({ x: 0, y: 0, w: w, h: h }) || { x: 0, y: 0, w: w, h: h };
  SEL = { x: TRIM.x, y: TRIM.y, w: TRIM.w, h: TRIM.h };
  render();
}

/* ==== 2. crop view ==== */
function render(){
  var cv = $('crop'), maxW = Math.min(680, $('cropWrap').clientWidth || 680), maxH = 340;
  VIEW_SCALE = Math.min(maxW / SRC.width, maxH / SRC.height, 2);
  cv.width = Math.round(SRC.width * VIEW_SCALE); cv.height = Math.round(SRC.height * VIEW_SCALE);
  var g = cv.getContext('2d');
  g.clearRect(0, 0, cv.width, cv.height);
  g.imageSmoothingQuality = 'high';
  g.drawImage(SRC, 0, 0, cv.width, cv.height);
  // dim everything outside the kept area
  var s = VIEW_SCALE, x = SEL.x * s, y = SEL.y * s, w = SEL.w * s, h = SEL.h * s;
  g.fillStyle = 'rgba(23,25,25,.72)';
  g.fillRect(0, 0, cv.width, y); g.fillRect(0, y + h, cv.width, cv.height - y - h);
  g.fillRect(0, y, x, h); g.fillRect(x + w, y, cv.width - x - w, h);
  g.strokeStyle = '#5da9f0'; g.lineWidth = 2; g.setLineDash([6, 4]);
  g.strokeRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
  g.setLineDash([]);
  buildOut();
}

/* ==== 3. the standard PNG ==== */
function buildOut(){
  // Step down by halves first: one big jump from a 3000 px source to 300 px looks rough.
  var cur = document.createElement('canvas'), cw = SEL.w, ch = SEL.h;
  cur.width = cw; cur.height = ch;
  cur.getContext('2d').drawImage(SRC, SEL.x, SEL.y, SEL.w, SEL.h, 0, 0, cw, ch);
  var k = Math.min((OUT_W - 2 * OUT_PAD) / SEL.w, (OUT_H - 2 * OUT_PAD) / SEL.h);
  while (cw * 0.5 > SEL.w * k && cw > 2 && ch > 2) {
    var nx = document.createElement('canvas');
    nx.width = Math.max(1, Math.round(cw / 2)); nx.height = Math.max(1, Math.round(ch / 2));
    var ng = nx.getContext('2d'); ng.imageSmoothingQuality = 'high';
    ng.drawImage(cur, 0, 0, nx.width, nx.height);
    cur = nx; cw = nx.width; ch = nx.height;
  }
  var dw = Math.round(SEL.w * k), dh = Math.round(SEL.h * k);
  var g = OUT.getContext('2d');
  g.clearRect(0, 0, OUT_W, OUT_H);
  g.imageSmoothingQuality = 'high';
  g.drawImage(cur, 0, 0, cw, ch, Math.round((OUT_W - dw) / 2), Math.round((OUT_H - dh) / 2), dw, dh);

  var url = OUT.toDataURL('image/png');
  var imgs = document.querySelectorAll('.pv-logo'), i;
  for (i = 0; i < imgs.length; i++) imgs[i].src = url;
  var bytes = Math.round((url.length - 22) * 3 / 4);

  // Advice
  var notes = [], aspect = SEL.w / SEL.h, upscaled = k > 1.05 && !(ORIGINAL && ORIGINAL.svg);
  if (aspect > 4)      notes.push({ bad: true, t: 'Very wide (' + aspect.toFixed(1) + ' : 1). In the tile the text will be only a few pixels tall. Drag a box around just the emblem.' });
  else if (aspect > 3) notes.push({ bad: false, t: 'Wide (' + aspect.toFixed(1) + ' : 1). Check the small preview — if the text is unreadable, keep only the emblem.' });
  if (upscaled)        notes.push({ bad: true, t: 'Low resolution: the kept area is only ' + SEL.w + ' × ' + SEL.h + ' px, so it is being enlarged and will look soft. Find a larger file if you can.' });
  if (bytes > MAX_BYTES) notes.push({ bad: true, t: 'File is ' + Math.round(bytes / 1024) + ' KB, over the 400 KB limit.' });
  if (!notes.length)   notes.push({ ok: true, t: 'Looks good: ' + SEL.w + ' × ' + SEL.h + ' px kept, ' + Math.max(1, Math.round(bytes / 1024)) + ' KB as a PNG.' });
  $('advice').innerHTML = notes.map(function(n){ return '<li class="' + (n.bad ? 'bad' : n.ok ? 'ok' : 'warn') + '">' + n.t + '</li>'; }).join('');
  $('outInfo').textContent = OUT_W + ' × ' + OUT_H + ' PNG · about ' + Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

/* drag a box on the crop view */
var drag = null;
function cropPoint(e){
  var r = $('crop').getBoundingClientRect();
  return { x: Math.max(0, Math.min(SRC.width, (e.clientX - r.left) / r.width * SRC.width)), y: Math.max(0, Math.min(SRC.height, (e.clientY - r.top) / r.height * SRC.height)) };
}
function cropDown(e){ if (!ORIGINAL) return; drag = { a: cropPoint(e) }; e.preventDefault(); }
function cropMove(e){
  if (!drag) return;
  var b = cropPoint(e), x = Math.min(drag.a.x, b.x), y = Math.min(drag.a.y, b.y), w = Math.abs(b.x - drag.a.x), h = Math.abs(b.y - drag.a.y);
  if (w < 4 || h < 4) return;
  drag.moved = true;
  SEL = { x: Math.floor(x), y: Math.floor(y), w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)) };
  render();
}
function cropUp(){
  if (!drag) return;
  var moved = drag.moved; drag = null;
  if (!moved) return;
  var tight = contentBounds(SEL);                 // snap the box to the artwork inside it
  SEL = tight || { x: TRIM.x, y: TRIM.y, w: TRIM.w, h: TRIM.h };
  if (!tight) status('That box was empty, so the whole logo is selected again.', 'warn');
  render();
}

/* ==== 4. details ==== */
function onNameChange(){
  var name = $('orgName').value.replace(/^\s+|\s+$/g, ''), hit = findOrg(name);
  if (hit) {
    $('orgType').value = hit.type; $('orgAliases').value = hit.aliases; $('orgFile').value = hit.file || (slugify(name) + '.png');
    $('existing').textContent = hit.file ? 'Already in the list — saving will replace its logo.' : 'Already in the list without a logo — saving will add one.';
    $('existing').className = 'hint upd';
  } else {
    $('orgFile').value = name ? slugify(name) + '.png' : '';
    $('existing').textContent = name ? 'New organization — saving will add it to the list.' : '';
    $('existing').className = 'hint';
  }
  $('pvOrg').textContent = name || 'Organization';
  $('pvOrg2').textContent = name || 'Organization';
}

/* ==== 5. save ==== */
function manifestText(){
  var sorted = ORGS.slice().sort(function(a, b){ return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0); });
  return [
    '/* WRI organization logos: the one list of which logo belongs to which organization.',
    '',
    '   name     display name shown on charts',
    '   type     Contractor | Railroad | Agency | (blank)',
    '   aliases  other spellings people type, separated by |  (matching is done by resolveOrg_ in chart.js)',
    '   file     PNG in this folder, standardised to 324 x 216 by logo-prep.html; blank = no logo yet (monogram tile)',
    '   updated  date the file last changed; used as ?v= so browsers fetch the new image',
    '',
    '   Edit with logo-prep.html, which rewrites this file. One organization per line, sorted by name.',
    '   Not a browser page? Remove this comment, the assignment at the start of the next line and the',
    '   final semicolon; what is left is plain JSON. */',
    'window.WRI_ORGS = ['
  ].join('\n') + '\n' + sorted.map(function(o){
    return '  ' + JSON.stringify({ name: o.name, type: o.type, aliases: o.aliases, file: o.file, updated: o.updated });
  }).join(',\n') + '\n];\n';
}
function outBlob(){
  return new Promise(function(resolve){ OUT.toBlob(function(b){ resolve(b); }, 'image/png'); });
}
function writeFile(dir, name, data){
  return dir.getFileHandle(name, { create: true }).then(function(fh){ return fh.createWritable(); })
    .then(function(w){ return w.write(data).then(function(){ return w.close(); }); });
}
function download(name, blob){
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
}
function save(){
  var name = $('orgName').value.replace(/^\s+|\s+$/g, ''), file = slugify($('orgFile').value.replace(/\.png$/i, '')) + '.png';
  if (!ORIGINAL) { status('Add an image first.', 'bad'); return; }
  if (!name) { status('Enter the organization’s display name.', 'bad'); $('orgName').focus(); return; }
  if (file === '.png') { status('Enter a file name.', 'bad'); return; }
  var clash = null;
  ORGS.forEach(function(o){ if (o.file === file && o.name.toLowerCase() !== name.toLowerCase()) clash = o; });
  if (clash) { status('The file name ' + file + ' is already used by ' + clash.name + '. Choose another.', 'bad'); return; }

  var entry = findOrg(name);
  if (!entry) { entry = { name: name, type: '', aliases: '', file: '', updated: '' }; ORGS.push(entry); }
  entry.name = name; entry.type = $('orgType').value;
  entry.aliases = $('orgAliases').value.split(/[|,\n]/).map(function(a){ return a.replace(/^\s+|\s+$/g, ''); }).filter(function(a){ return a; }).join('|');
  entry.file = file; entry.updated = today();

  var ext = (ORIGINAL.name.match(/\.[A-Za-z0-9]+$/) || ['.png'])[0].toLowerCase();
  var origName = file.replace(/\.png$/, '') + '-original' + ext;
  var manifest = new Blob([manifestText()], { type: 'text/javascript' });

  outBlob().then(function(png){
    if (DIR) {
      return writeFile(DIR, file, png)
        .then(function(){ return DIR.getDirectoryHandle('originals', { create: true }); })
        .then(function(od){ return writeFile(od, origName, ORIGINAL.blob); })
        .then(function(){ return writeFile(DIR, 'logos.js', manifest); })
        .then(function(){ status('Saved ' + file + ', originals/' + origName + ' and logos.js into the folder. Commit and push to publish.', 'ok'); });
    }
    download(file, png);
    download('logos.js', manifest);
    status('Downloaded ' + file + ' and logos.js. Move both into the repo folder (replace the old logos.js), and keep the original image in originals/.', 'ok');
  }).then(function(){ renderList(file); }, function(err){ status('Could not save: ' + (err && err.message || err), 'bad'); });
}

function connectFolder(){
  if (!window.showDirectoryPicker) { status('This browser cannot write to a folder. Use Chrome or Edge, or let Save download the files.', 'warn'); return; }
  window.showDirectoryPicker({ mode: 'readwrite' }).then(function(h){
    return h.getFileHandle('logos.js').then(function(){ return true; }, function(){ return false; }).then(function(has){
      DIR = h;
      $('folderState').textContent = 'Connected: ' + h.name + (has ? '' : ' (no logos.js found here — is this the wri-org-logos folder?)');
      $('folderState').className = 'hint ' + (has ? 'ok' : 'warn');
      $('btnSave').textContent = 'Save into folder';
    });
  }, function(){ /* picker dismissed */ });
}

/* ==== current logos ==== */
function renderList(justSaved){
  var sorted = ORGS.slice().sort(function(a, b){ return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
  $('listCount').textContent = sorted.length + ' organizations';
  var url = justSaved ? OUT.toDataURL('image/png') : '';
  $('list').innerHTML = sorted.map(function(o){
    var src = (justSaved && o.file === justSaved) ? url : (o.file ? o.file + (o.updated ? '?v=' + o.updated : '') : '');
    return '<li data-name="' + o.name.replace(/"/g, '&quot;') + '">' +
      (src ? '<img src="' + src + '" alt="">' : '<span class="nologo">none</span>') +
      '<div><b>' + o.name.replace(/</g, '&lt;') + '</b><span>' + (o.type || '—') + (o.aliases ? ' · ' + o.aliases.replace(/</g, '&lt;').replace(/\|/g, ', ') : '') + '</span></div></li>';
  }).join('');
}

function init(){
  var drop = $('drop'), pick = $('pick');
  $('btnPick').onclick = function(){ pick.click(); };
  pick.onchange = function(){ if (pick.files[0]) loadBlob(pick.files[0], pick.files[0].name); pick.value = ''; };
  ['dragenter', 'dragover'].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.className = 'drop over'; }); });
  ['dragleave', 'drop'].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.className = 'drop'; }); });
  drop.addEventListener('drop', function(e){ var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) loadBlob(f, f.name); });
  document.addEventListener('paste', function(e){
    var items = (e.clipboardData && e.clipboardData.items) || [], i;
    for (i = 0; i < items.length; i++) { if (/^image\//.test(items[i].type)) { var b = items[i].getAsFile(); if (b) { loadBlob(b, b.name && b.name !== 'image.png' ? b.name : ''); e.preventDefault(); return; } } }
  });
  var cv = $('crop');
  cv.addEventListener('pointerdown', cropDown);
  window.addEventListener('pointermove', cropMove);
  window.addEventListener('pointerup', cropUp);
  $('btnWhole').onclick = function(){ if (!TRIM) return; SEL = { x: TRIM.x, y: TRIM.y, w: TRIM.w, h: TRIM.h }; render(); };
  $('orgName').addEventListener('input', onNameChange);
  $('btnSave').onclick = save;
  $('btnFolder').onclick = connectFolder;
  $('list').addEventListener('click', function(e){
    var li = e.target; while (li && li.tagName !== 'LI') li = li.parentNode;
    if (!li) return;
    $('orgName').value = li.getAttribute('data-name'); onNameChange();
    status('Editing ' + li.getAttribute('data-name') + '. Add a new image to replace its logo, or change the details and save.', '');
  });
  renderList();
  onNameChange();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
