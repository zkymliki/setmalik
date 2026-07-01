/**
 * ============================================================
 *   SET MALIK v2 - Quantumult X Script
 *   Bot    : @setmalik_bot
 *   Perintah : /setroll [angka]  /resetroll  /status
 *   Target : www.google.com/search?.*dadu.*
 * ============================================================
 */

// ===================== KONFIGURASI ========================
var BOT_TOKEN = "8850509848:AAFNPHTdth4SYjTQcW_U48QmhWzSXsJx1CU";
var CHAT_ID   = "8092122107";
var API_BASE  = "https://api.telegram.org/bot" + BOT_TOKEN;
// ==========================================================

// Ambil target angka dari reply bot
function getTargetFromBot() {
  return new Promise(function(resolve) {
    $task.fetch({
      url: API_BASE + "/getUpdates?limit=30",
      method: "GET"
    }).then(function(response) {
      try {
        var data = JSON.parse(response.body);
        if (!data.ok || !data.result || data.result.length === 0) {
          resolve(null);
          return;
        }

        var updates = data.result;

        // Cari pesan dari bot sendiri yang mengandung "diatur ke"
        // (reply bot setelah user kirim /setroll)
        var botReplies = updates.filter(function(u) {
          return u.message
            && u.message.from
            && u.message.from.is_bot === true
            && u.message.text
            && u.message.text.indexOf("diatur ke") !== -1;
        }).sort(function(a, b) {
          return b.message.date - a.message.date;
        });

        if (botReplies.length > 0) {
          var text = botReplies[0].message.text;
          var match = text.match(/diatur ke[:\s\xA0]+(\d+)/i);
          if (match) {
            var target = parseInt(match[1]);
            if (!isNaN(target) && target > 0) {
              resolve(target);
              return;
            }
          }
        }

        // Cari pesan user yang mengandung /setroll
        var userMsgs = updates.filter(function(u) {
          return u.message
            && u.message.text
            && (u.message.text.indexOf("/setroll") === 0
                || u.message.text.indexOf("/resetroll") === 0);
        }).sort(function(a, b) {
          return b.message.date - a.message.date;
        });

        if (userMsgs.length > 0) {
          var lastCmd = userMsgs[0].message.text;

          if (lastCmd.indexOf("/resetroll") === 0) {
            resolve(null);
            return;
          }

          if (lastCmd.indexOf("/setroll") === 0) {
            var numStr = lastCmd.replace("/setroll", "").trim();
            var num = parseInt(numStr);
            if (!isNaN(num) && num > 0) {
              resolve(num);
              return;
            }
          }
        }

        resolve(null);
      } catch (e) {
        resolve(null);
      }
    }).catch(function() { resolve(null); });
  });
}

// Distribusi total angka ke N dadu (masing-masing 1-6)
function distributeDice(total, count) {
  var minTotal = count;
  var maxTotal = count * 6;

  if (total < minTotal) total = minTotal;
  if (total > maxTotal) total = maxTotal;

  var dice = [];
  var i;
  for (i = 0; i < count; i++) dice.push(1);

  var remaining = total - count;
  for (i = 0; i < count && remaining > 0; i++) {
    var add = Math.min(5, remaining);
    dice[i] += add;
    remaining -= add;
  }

  // Acak urutan supaya tidak terlihat pola
  for (i = dice.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = dice[i];
    dice[i] = dice[j];
    dice[j] = temp;
  }

  return dice;
}

// Kirim notifikasi ke bot
function notify(msg) {
  $task.fetch({
    url: API_BASE + "/sendMessage",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: msg,
      parse_mode: "HTML"
    })
  }).catch(function() {});
}

// ===================== MAIN LOGIC ========================
getTargetFromBot().then(function(targetTotal) {
  var body = $response.body;

  if (!body) {
    $done({});
    return;
  }

  // Jika tidak ada setting / reset → pass normal
  if (!targetTotal) {
    $done({ body: body });
    return;
  }

  // ─── Inject script override ke halaman Google dadu ───
  // Script ini override Math.random() supaya dadu keluar angka yang dikontrol
  var diceValues = distributeDice(targetTotal, 9); // default 9 dadu Google
  var diceJSON   = JSON.stringify(diceValues);
  var totalActual = diceValues.reduce(function(a, b) { return a + b; }, 0);

  var injectScript = [
    "<script>",
    "(function(){",
    "  var _targetDice = " + diceJSON + ";",
    "  var _idx = 0;",
    "  var _orig = Math.random.bind(Math);",
    "  Math.random = function() {",
    "    if (_idx < _targetDice.length) {",
    "      var v = _targetDice[_idx++];",
    "      return (v - 1) / 6 + 0.0001;",
    "    }",
    "    return _orig();",
    "  };",
    "  Math.floor_orig = Math.floor.bind(Math);",
    "})();",
    "<\/script>"
  ].join("\n");

  // Sisipkan sebelum </head>
  var modified = body;
  if (body.indexOf("</head>") !== -1) {
    modified = body.replace("</head>", injectScript + "\n</head>");
  } else if (body.indexOf("</body>") !== -1) {
    modified = body.replace("</body>", injectScript + "\n</body>");
  } else {
    modified = body + "\n" + injectScript;
  }

  notify(
    "\u2705 <b>SET MALIK AKTIF</b>\n" +
    "\uD83C\uDFB2 Target total: <b>" + targetTotal + "</b>\n" +
    "\uD83D\uDD22 Distribusi: <b>" + diceValues.join(" | ") + "</b>\n" +
    "\uD83D\uDCCA Actual total: <b>" + totalActual + "</b>\n" +
    "\uD83E\uDD16 @setmalik_bot"
  );

  $done({ body: modified });

}).catch(function() {
  $done({ body: $response.body || "" });
});
