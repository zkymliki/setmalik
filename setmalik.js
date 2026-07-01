/**
 * ============================================================
 *   SET MALIK - Quantumult X Script
 *   Bot: @setmalik_bot
 *   Fungsi: Intercept & manipulasi hasil dadu via bot Telegram
 *   Target: www.google.com/search?.*dadu.*
 * ============================================================
 *
 *  HOW TO USE:
 *  1. Upload file ini ke GitHub (raw URL)
 *  2. Pasang di Quantumult X -> rewrite_local:
 *     ^https?:\/\/www\.google\.com\/search\?.*dadu.* url script-response-body <URL_RAW_FILE_INI>
 *  3. Tambahkan di [mitm] -> hostname: www.google.com
 *  4. Kirim angka ke @setmalik_bot untuk set hasil dadu
 *     Format: /set 3  (untuk set angka 3)
 *     Format: /set 1 2 3 4 5 6  (untuk sequence 6 dadu)
 *     Format: /reset  (untuk kembali ke mode random)
 *
 * ============================================================
 */

// ===================== KONFIGURASI ========================
const BOT_TOKEN = "8850509848:AAFNPHTdth4SYjTQcW_U48QmhWzSXsJx1CU";
const CHAT_ID   = "8092122107"; // Chat ID kamu
const API_BASE  = "https://api.telegram.org/bot" + BOT_TOKEN;
// ==========================================================

// Ambil setting angka dari bot Telegram
function getBotSetting() {
  return new Promise(function(resolve) {
    $task.fetch({
      url: API_BASE + "/getUpdates?limit=10&allowed_updates=%5B%22message%22%5D",
      method: "GET"
    }).then(function(response) {
      try {
        var data = JSON.parse(response.body);
        if (!data.ok || !data.result || data.result.length === 0) {
          resolve(null);
          return;
        }

        // Ambil pesan terbaru dari chat kamu
        var messages = data.result
          .filter(function(u) {
            return u.message && String(u.message.chat.id) === String(CHAT_ID);
          })
          .sort(function(a, b) {
            return b.message.date - a.message.date;
          });

        if (messages.length === 0) {
          resolve(null);
          return;
        }

        var lastMsg = messages[0].message.text || "";

        // Parse perintah /set
        if (lastMsg.indexOf("/set ") === 0) {
          var parts = lastMsg.replace("/set ", "").trim().split(/\s+/);
          var numbers = parts
            .map(function(n) { return parseInt(n); })
            .filter(function(n) { return !isNaN(n) && n >= 1 && n <= 6; });
          if (numbers.length > 0) {
            resolve(numbers);
            return;
          }
        }

        // /reset -> kembali random
        if (lastMsg.indexOf("/reset") === 0) {
          resolve("random");
          return;
        }

        // Coba parse angka langsung (tanpa /set)
        var directNum = parseInt(lastMsg);
        if (!isNaN(directNum) && directNum >= 1 && directNum <= 6) {
          resolve([directNum]);
          return;
        }

        resolve(null);
      } catch (e) {
        resolve(null);
      }
    }).catch(function() { resolve(null); });
  });
}

// Kirim notifikasi ke bot setelah berhasil set
function sendNotification(message) {
  if (CHAT_ID === "GANTI_DENGAN_CHAT_ID_KAMU") return;
  $task.fetch({
    url: API_BASE + "/sendMessage",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML"
    })
  }).catch(function() {});
}

// Modifikasi rekursif nilai dadu di JSON response
function modifyDiceValues(obj, targetNums, idx) {
  if (!idx) idx = { i: 0 };

  if (typeof obj === "number" && obj >= 1 && obj <= 6) {
    var newVal = targetNums[idx.i % targetNums.length];
    idx.i++;
    return newVal;
  }

  if (Array.isArray(obj)) {
    return obj.map(function(item) {
      return modifyDiceValues(item, targetNums, idx);
    });
  }

  if (typeof obj === "object" && obj !== null) {
    var result = {};
    var diceKeys = [
      "result", "dice", "value", "number", "roll", "score",
      "angka", "dadu", "hasil", "point", "points", "total",
      "face", "side", "val", "num", "outcome", "diceResult"
    ];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var keyLower = key.toLowerCase();
        var isDiceKey = diceKeys.some(function(k) {
          return keyLower.indexOf(k) !== -1;
        });
        if (isDiceKey) {
          result[key] = modifyDiceValues(obj[key], targetNums, idx);
        } else {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }

  return obj;
}

// ===================== MAIN LOGIC ========================
getBotSetting().then(function(setting) {
  try {
    var body = $response.body;

    if (!body) {
      $done({});
      return;
    }

    // Jika mode random atau tidak ada setting
    if (!setting || setting === "random") {
      $done({ body: body });
      return;
    }

    // Coba parse JSON
    var parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      // Bukan JSON -> cari pattern dadu di text/HTML
      var modified = body;
      var dicePatterns = [
        { regex: /"result"\s*:\s*(\d+)/g, key: "result" },
        { regex: /"dice"\s*:\s*(\d+)/g, key: "dice" },
        { regex: /"value"\s*:\s*(\d+)/g, key: "value" },
        { regex: /"number"\s*:\s*(\d+)/g, key: "number" },
        { regex: /"roll"\s*:\s*(\d+)/g, key: "roll" },
        { regex: /"score"\s*:\s*(\d+)/g, key: "score" },
        { regex: /"angka"\s*:\s*(\d+)/g, key: "angka" },
        { regex: /"dadu"\s*:\s*(\d+)/g, key: "dadu" },
        { regex: /"hasil"\s*:\s*(\d+)/g, key: "hasil" }
      ];

      var replaceIdx = 0;
      var didModify = false;

      dicePatterns.forEach(function(p) {
        modified = modified.replace(p.regex, function(match, num) {
          var newNum = setting[replaceIdx % setting.length];
          replaceIdx++;
          didModify = true;
          return match.replace(num, String(newNum));
        });
      });

      if (didModify) {
        sendNotification(
          "\u2705 <b>SET MALIK AKTIF</b>\n" +
          "\uD83C\uDFB2 Angka dadu diset: <b>" + setting.join(", ") + "</b>\n" +
          "\uD83E\uDD16 Bot: @setmalik_bot\n" +
          "\u23F0 Mode: Text/HTML"
        );
        $done({ body: modified });
      } else {
        $done({ body: body });
      }
      return;
    }

    // Modifikasi JSON
    var modifiedObj = modifyDiceValues(parsed, setting);
    var newBody = JSON.stringify(modifiedObj);

    sendNotification(
      "\u2705 <b>SET MALIK BERHASIL</b>\n" +
      "\uD83C\uDFB2 Target angka: <b>" + setting.join(", ") + "</b>\n" +
      "\uD83E\uDD16 Bot: @setmalik_bot\n" +
      "\uD83D\uDCF1 Mode: JSON Response"
    );

    $done({ body: newBody });

  } catch (err) {
    $done({ body: $response.body || "" });
  }
}).catch(function() {
  $done({ body: $response.body || "" });
});
