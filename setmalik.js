/**
 * SET MALIK v4 - Quantumult X Script
 * Mengontrol dadu Google via Firebase Realtime Database
 */

// ====== CONFIGURATION ======
const FIREBASE_URL = "https://setkbojeng-default-rtdb.asia-southeast1.firebasedatabase.app/8092122107.json";
// ===========================

const url = $request.url;

if (url.indexOf("/dice-ctrl/get") !== -1) {
  // Ambil target dari Firebase Cloud
  $task.fetch({
    url: FIREBASE_URL,
    method: "GET",
    timeout: 3
  }).then(response => {
    let target = null;
    try {
      const data = JSON.parse(response.body);
      if (data && data.target !== null && data.target !== undefined) {
        target = data.target;
        // Beri notifikasi di iPhone jika target aktif terdeteksi
        $notify("🎲 SET MALIK ACTIVE", "Target Dadu Ditemukan!", "Target Angka: " + target);
      }
    } catch(e) {}

    $done({
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({ status: "success", target: target })
      }
    });
  }, reason => {
    // Fallback jika database tidak terhubung
    $done({
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ status: "error", target: null })
      }
    });
  });

} else if (url.indexOf("/dice-ctrl/reset") !== -1) {
  // Reset target di Firebase Cloud ke null
  $task.fetch({
    url: FIREBASE_URL,
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ target: null, status: "inactive" }),
    timeout: 3
  }).then(response => {
    $done({
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({ status: "success" })
      }
    });
  }, reason => {
    $done({
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ status: "error" })
      }
    });
  });

} else {
  // Menyuntikkan JS injector ke halaman dadu Google
  let body = $response.body;
  if (!body) {
    $done({});
    return;
  }

  // Hapus Content-Security-Policy agar script injeksi tidak diblokir browser
  let headers = $response.headers;
  if (headers) {
    const cspKeys = [
      "content-security-policy",
      "content-security-policy-report-only",
      "x-content-type-options",
      "x-frame-options"
    ];
    cspKeys.forEach(function(key) {
      if (headers[key]) delete headers[key];
      if (headers[key.toUpperCase()]) delete headers[key.toUpperCase()];
    });
  }

  const injectScript = `
<script id="_setmalik_injector">
(function() {
  'use strict';
  var _origRandom = Math.random.bind(Math);
  var _queue = [];
  var _armed = false;

  function dieToRandom(v) {
    return (v - 1) / 6 + 0.04;
  }

  function distributeSum(target, count) {
    var min = count;
    var max = count * 6;
    if (target < min) target = min;
    if (target > max) target = max;
    var vals = [];
    for (var i = 0; i < count; i++) vals.push(1);
    var remaining = target - count;
    var safety = 0;
    while (remaining > 0 && safety++ < 50000) {
      var idx = Math.floor(_origRandom() * count);
      if (vals[idx] < 6) {
        vals[idx]++;
        remaining--;
      }
    }
    return vals;
  }

  function getDiceCount() {
    var selectors = [
      '[data-face]',
      '[class*="dice-face"]',
      '[class*="diceroller"] [class*="item"]',
      'g-dice-roll-item',
      '[jsmodel*="dice"] > div > div > div'
    ];
    for (var s = 0; s < selectors.length; s++) {
      var els = document.querySelectorAll(selectors[s]);
      if (els.length > 0) return els.length;
    }
    return 9; // Default fallback
  }

  Math.random = function() {
    if (_queue.length > 0) {
      var val = _queue.shift();
      if (_queue.length === 0) {
        _armed = false;
        fetch('/dice-ctrl/reset', { cache: 'no-store' }).catch(function(){});
      }
      return val;
    }
    return _origRandom();
  };

  function fetchTarget() {
    fetch('/dice-ctrl/get', { cache: 'no-store' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.target !== null && data.target !== undefined) {
          var count = getDiceCount();
          var vals = distributeSum(parseInt(data.target), count);
          _queue = vals.map(dieToRandom);
          _armed = true;
          console.log('[DiceCtrl] Target=' + data.target + ' Dice=' + count + ' Vals=' + vals.join(','));
        }
      })
      .catch(function() {});
  }

  setInterval(fetchTarget, 1000);
})();
</script>
  `;

  let modified = body;
  if (body.indexOf("</head>") !== -1) {
    modified = body.replace("</head>", injectScript + "</head>");
  } else if (body.indexOf("<body") !== -1) {
    const idx = body.indexOf("<body");
    const endTag = body.indexOf(">", idx) + 1;
    modified = body.substring(0, endTag) + injectScript + body.substring(endTag);
  } else {
    modified = injectScript + body;
  }

  $done({ body: modified, headers: headers });
}
