/**
 * SET MALIK v6 - Quantumult X Script
 * Lebih tangguh, menggunakan regex pencarian umum agar pasti ter-intercept.
 */

const FIREBASE_URL = "https://setkbojeng-default-rtdb.asia-southeast1.firebasedatabase.app/8092122107.json";

// Kirim notifikasi debug untuk memastikan script berjalan
$notify("🎲 SET MALIK v6", "Script Terbakar", "Mencoba memproses halaman pencarian...");

let body = $response.body;
if (!body) {
  $done({});
  return;
}

// Hanya proses jika halaman mengandung elemen dadu / dice
const contentLower = body.toLowerCase();
if (contentLower.indexOf("dadu") === -1 && contentLower.indexOf("dice") === -1 && contentLower.indexOf("roll") === -1) {
  // Jika bukan halaman dadu, langsung kembalikan halaman asli dengan cepat
  $done({});
  return;
}

// Beritahu pengguna jika halaman dadu terdeteksi dan akan diinjeksi
$notify("🎲 SET MALIK ACTIVE", "Dadu Google Terdeteksi", "Menyuntikkan pengontrol hasil...");

// Bersihkan header Security (CSP) agar script injeksi tidak diblokir browser
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

const INJECT = '<script id="_sm6">(function(){' +
  'var FB="' + FIREBASE_URL + '";' +
  'var _o=Math.random.bind(Math);' +
  'var _q=[];' +
  'function r2d(v){return(v-1)/6+0.04;}' +
  'function dist(t,n){' +
    't=Math.max(n,Math.min(n*6,parseInt(t)));' +
    'var a=[],i,rem,s=0;' +
    'for(i=0;i<n;i++)a.push(1);' +
    'rem=t-n;' +
    'while(rem>0&&s++<99999){i=Math.floor(_o()*n);if(a[i]<6){a[i]++;rem--;}}' +
    'return a;' +
  '}' +
  'function nDice(){' +
    'var ss=["[data-face]","g-dice-roll-item","[class*=\\"diceroller\\"] [class*=\\"item\\"]","[jsmodel*=\\"dice\\"] > div > div > div"];' +
    'for(var i=0;i<ss.length;i++){var e=document.querySelectorAll(ss[i]);if(e.length>0)return e.length;}' +
    'return 9;' +
  '}' +
  'Math.random=function(){' +
    'if(_q.length>0){' +
      'var v=_q.shift();' +
      'if(_q.length===0){' +
        'fetch(FB,{method:"PATCH",headers:{"Content-Type":"application/json"},body:\'{"target":null}\'}).catch(function(){});' +
      '}' +
      'return v;' +
    '}' +
    'return _o();' +
  '};' +
  'function poll(){' +
    'fetch(FB+"?nc="+Date.now())' +
      '.then(function(r){return r.json();})' +
      '.then(function(d){' +
        'if(d&&d.target!==null&&d.target!==undefined&&_q.length===0){' +
          'var n=nDice();' +
          'var vals=dist(d.target,n);' +
          '_q=vals.map(r2d);' +
          'console.log("[SM6] target="+d.target+" n="+n+" vals="+vals.join(","));' +
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
