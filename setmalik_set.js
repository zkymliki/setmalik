/**
 * SET MALIK - URL Trigger Script
 * Dijalankan saat user buka: google.com/search?q=setdadu+[angka]
 * Menyimpan target ke $prefs (storage iPhone lokal)
 */

var url = $request.url || "";

// Ambil angka dari URL: ?q=setdadu+30 atau ?q=setdadu30
var match = url.match(/[?&]q=setdadu[+%20]?(\d+)/i);

if (match) {
  var target = parseInt(match[1]);
  if (!isNaN(target) && target > 0 && target <= 54) {
    $prefs.setValueForKey(String(target), "setmalik_target");
    $notify("SET MALIK", "✅ Target diset!", "🎲 Angka dadu: " + target);
  } else {
    $notify("SET MALIK", "❌ Angka tidak valid", "Gunakan 1-54");
  }
} else if (url.indexOf("resetdadu") !== -1) {
  $prefs.removeValueForKey("setmalik_target");
  $notify("SET MALIK", "🔄 Reset!", "Dadu kembali random");
}

// Pass request normal
$done({});
