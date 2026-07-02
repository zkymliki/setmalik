/**
 * SET MALIK v16 - Quantumult X Script
 * Desain Kunci Target 4 Detik (Anti-Physics & Anti-Late Polling)
 * Update Otomatis Real-time via GitHub
 */

const FIREBASE_URL = "https://setkbojeng-default-rtdb.asia-southeast1.firebasedatabase.app/8092122107.json";

// Kirim notifikasi ke iPhone saat dimuat
$notify("🎲 SET MALIK v16", "Sistem Kunci 4s Aktif", "Menunggu kocokan dadu di Safari...");

let body = $response.body;
if (!body) {
  $done({});
  return;
}

// Bersihkan header Security (CSP)
let headers = $response.headers;
if (headers) {
  [
    'content-security-policy',
    'Content-Security-Policy',
    'content-security-policy-report-only',
    'Content-Security-Policy-Report-Only',
    'x-content-type-options',
    'X-Content-Type-Options',
    'x-frame-options',
    'X-Frame-Options',
    'cross-origin-opener-policy',
    'Cross-Origin-Opener-Policy',
    'cross-origin-embedder-policy',
    'Cross-Origin-Embedder-Policy'
  ].forEach(function(k) {
    if (headers[k]) delete headers[k];
  });
}

// JS Injector v16
const INJECT = '<script id="_sm16">(function(){' +
  'var FB="' + FIREBASE_URL + '";' +
  'var _o=Math.random.bind(Math);' +
  'var _q=[];' +
  'var _activeTarget=null;' +
  'var _lastRandomTime=0;' +
  'var _isRolling=false;' +
  'var _rollTimeout=null;' +
  'function r2d(v){return(v-1)/6+0.03;}' +
  // Pembagian nilai target ke N dadu secara adil
  'function dist(t,n){' +
    't=Math.max(n,Math.min(n*6,parseInt(t)));' +
    'var a=[],i,rem,s=0;' +
    'for(i=0;i<n;i++)a.push(1);' +
    'rem=t-n;' +
    'while(rem>0&&s++<99999){i=Math.floor(_o()*n);if(a[i]<6){a[i]++;rem--;}}' +
    'return a;' +
  '}' +
  // Deteksi jumlah dadu yang aktif di layar (menembus Shadow DOM)
  'function nDice(){' +
    'var count=0;' +
    'try {' +
      'var roots = Array.from(document.querySelectorAll("*")).filter(el => el.shadowRoot);' +
      'roots.forEach(function(root){' +
        'var canvasList = root.shadowRoot.querySelectorAll("canvas");' +
        'if(canvasList.length > 0) count = canvasList.length;' +
      '});' +
    '} catch(e) {}' +
    'return count > 0 ? count : 3;' + // Fallback ke 3 dadu
  '}' +
  // override Math.random (Kunci 4 Detik)
  'Math.random=function(){' +
    'var now = Date.now();' +
    // Jika selisih waktu dengan pemanggilan random sebelumnya > 1.5 detik (1500ms)
    // dan target di Firebase aktif, kita kunci target untuk lemparan baru ini!
    'if(now - _lastRandomTime > 1500){' +
      'if(_activeTarget !== null && _activeTarget !== undefined && !_isRolling){' +
        'var n = nDice();' +
        'var vals = dist(_activeTarget, n);' +
        '_q = vals.map(r2d);' +
        '_isRolling = true;' +
        'console.log("[SM16] Lembaran baru dikunci! target=" + _activeTarget + " vals=" + vals.join(","));' +
        // Segera hapus target di Firebase agar tidak ter-trigger double di roll berikutnya
        'fetch(FB,{method:"PATCH",headers:{"Content-Type":"application/json"},body:\'{"target":null}\'}).catch(function(){});' +
        '_activeTarget = null;' +
        // Pertahankan status rolling dan antrean selama 4 detik penuh agar animasi selesai
        'if(_rollTimeout) clearTimeout(_rollTimeout);' +
        '_rollTimeout = setTimeout(function(){' +
          '_isRolling = false;' +
          '_q = [];' +
          'console.log("[SM16] Kunci target dilepas.");' +
        '}, 4000);' +
      '}' +
    '}' +
    '_lastRandomTime = now;' +
    // Jika sedang dalam status mengunci target, berikan nilai dari antrean
    'if(_isRolling && _q.length > 0){' +
      'return _q.shift();' +
    '}' +
    'return _o();' +
  '};' +
  // Polling database Firebase secara real-time
  'function poll(){' +
    'if(_isRolling) return;' + // Jangan update target dari Firebase saat dadu sedang berputar
    'fetch(FB+"?nc="+Date.now())' +
      '.then(function(r){return r.json();})' +
      '.then(function(d){' +
        'if(d && d.target !== null && d.target !== undefined){' +
          '_activeTarget=d.target;' +
        '} else {' +
          '_activeTarget=null;' +
        '}' +
      '})' +
      '.catch(function(){});' +
  '}' +
  'setInterval(poll,800);' +
  'setTimeout(poll,50);' +
'})();<\/script>';

let modified = body;
if (body.indexOf('</head>') !== -1) {
  modified = body.replace('</head>', INJECT + '</head>');
} else if (body.indexOf('<body') !== -1) {
  var idx = body.indexOf('<body');
  var end = body.indexOf('>', idx) + 1;
  modified = body.substring(0, end) + INJECT + body.substring(end);
} else {
  modified = INJECT + body;
}

$done({ body: modified, headers: headers });
