/**
 * SET MALIK v10 - Quantumult X Script
 * Remote Dadu Google Search (Bahasa Indonesia & Inggris)
 * Menghindari pemicu klik palsu saat menambah/mengubah dadu
 */

const FIREBASE_URL = "https://setkbojeng-default-rtdb.asia-southeast1.firebasedatabase.app/8092122107.json";

// Kirim notifikasi ke iPhone saat halaman Google Dice dimuat
$notify("🎲 SET MALIK v10", "Sistem Siap", "Menunggu tombol Lempar diklik...");

let body = $response.body;
if (!body) {
  $done({});
  return;
}

// Bersihkan header Security (CSP) agar injeksi berjalan mulus
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

// JS Injector v10 yang sangat presisi
const INJECT = '<script id="_sm10">(function(){' +
  'var FB="' + FIREBASE_URL + '";' +
  'var _o=Math.random.bind(Math);' +
  'var _q=[];' +
  'var _activeTarget=null;' +
  'var _justClicked=false;' +
  'var _clickTimeout=null;' +
  'function r2d(v){return(v-1)/6+0.03;}' + // Formula mapping dadu 1-6 ke Math.random
  // Pembagian nilai target ke N dadu secara adil
  'function dist(t,n){' +
    't=Math.max(n,Math.min(n*6,parseInt(t)));' +
    'var a=[],i,rem,s=0;' +
    'for(i=0;i<n;i++)a.push(1);' +
    'rem=t-n;' +
    'while(rem>0&&s++<99999){i=Math.floor(_o()*n);if(a[i]<6){a[i]++;rem--;}}' +
    'return a;' +
  '}' +
  // Deteksi jumlah dadu aktif di layar Google Search
  'function nDice(){' +
    'var ss=["[data-face]","g-dice-roll-item","[class*=\\"diceroller\\"] [class*=\\"item\\"]","[jsmodel*=\\"dice\\"] > div > div > div"];' +
    'for(var i=0;i<ss.length;i++){var e=document.querySelectorAll(ss[i]);if(e.length>0)return e.length;}' +
    'return 9;' + // Default fallback ke 9 dadu jika selector tidak ketemu
  '}' +
  // Mencari tombol Roll/Lempar asli dan mengikat event click
  'function bindRollButton(){' +
    'var buttons=Array.from(document.querySelectorAll("button, div, span, a"))' +
      '.filter(function(el){' +
        'if(!el.innerText) return false;' +
        'var txt=el.innerText.trim().toLowerCase();' +
        'return txt === "lempar" || txt === "roll" || txt === "kocok";' +
      '});' +
    'buttons.forEach(function(btn){' +
      'if(!btn.getAttribute("data-sm-bound")){' +
        'btn.setAttribute("data-sm-bound", "true");' +
        'var handler = function(){' +
          '_justClicked=true;' +
          'console.log("[SM10] Tombol Lempar diklik! Sistem siap menyuntikkan target.");' +
          'if(_clickTimeout)clearTimeout(_clickTimeout);' +
          '_clickTimeout=setTimeout(function(){_justClicked=false;},2500);' +
        '};' +
        'btn.addEventListener("mousedown", handler, true);' +
        'btn.addEventListener("touchstart", handler, true);' +
      '}' +
    '});' +
  '}' +
  'setInterval(bindRollButton, 300);' +
  // Intersept Math.random
  'Math.random=function(){' +
    'if(_q.length>0){' +
      'var v=_q.shift();' +
      'if(_q.length===0){' +
        // Setelah dadu terakhir selesai disuntik, hapus target di Firebase
        'fetch(FB,{method:"PATCH",headers:{"Content-Type":"application/json"},body:\'{"target":null}\'}).catch(function(){});' +
      '}' +
      'return v;' +
    '}' +
    'if(_justClicked&&_activeTarget!==null&&_activeTarget!==undefined){' +
      'var n=nDice();' +
      'var vals=dist(_activeTarget,n);' +
      '_q=vals.map(r2d);' +
      '_activeTarget=null;' +
      '_justClicked=false;' +
      'console.log("[SM10] Dadu berhasil dimanipulasi! target="+vals.reduce((a,b)=>a+b,0)+" vals="+vals.join(","));' +
      'if(_q.length>0) return _q.shift();' +
    '}' +
    'return _o();' +
  '};' +
  // Ambil target angka dari Firebase secara real-time
  'function poll(){' +
    'fetch(FB+"?nc="+Date.now())' +
      '.then(function(r){return r.json();})' +
      '.then(function(d){' +
        'if(d&&d.target!==null&&d.target!==undefined){' +
          '_activeTarget=d.target;' +
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
