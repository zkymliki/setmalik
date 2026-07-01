/**
 * SET MALIK v3 - Quantumult X Script
 * Baca target dari $prefs (lokal iPhone)
 * Set via Safari: cari "setdadu 30" di Google
 * Reset via Safari: cari "resetdadu" di Google
 */

var body = $response.body;
if (!body) { $done({}); return; }

// Baca target dari storage lokal iPhone
var targetStr = $prefs.valueForKey("setmalik_target");
var targetTotal = targetStr ? parseInt(targetStr) : null;

if (!targetTotal || isNaN(targetTotal)) {
  // Tidak ada setting -> pass normal
  $done({ body: body });
  return;
}

// Distribusi total angka ke 9 dadu (1-6 tiap dadu)
function distributeDice(total, count) {
  if (total < count) total = count;
  if (total > count * 6) total = count * 6;

  var dice = [];
  var i;
  for (i = 0; i < count; i++) dice.push(1);

  var rem = total - count;
  for (i = 0; i < count && rem > 0; i++) {
    var add = Math.min(5, rem);
    dice[i] += add;
    rem -= add;
  }

  // Shuffle
  for (i = dice.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = dice[i]; dice[i] = dice[j]; dice[j] = t;
  }
  return dice;
}

var diceValues = distributeDice(targetTotal, 9);
var totalActual = diceValues.reduce(function(a,b){return a+b;}, 0);
var diceJSON = JSON.stringify(diceValues);

// Inject script override Math.random ke halaman
var injectScript =
  '<script id="_sm_inject">' +
  '(function(){' +
  '  var _d=' + diceJSON + ';' +
  '  var _i=0;' +
  '  var _o=Math.random.bind(Math);' +
  '  Math.random=function(){' +
  '    if(_i<_d.length){' +
  '      var v=_d[_i++];' +
  '      return (v-1)/6+0.0001;' +
  '    }' +
  '    _i=0;' +
  '    var v=_d[_i++];' +
  '    return (v-1)/6+0.0001;' +
  '  };' +
  '})();' +
  '<\/script>';

var modified = body;
if (body.indexOf("</head>") !== -1) {
  modified = body.replace("</head>", injectScript + "</head>");
} else {
  modified = injectScript + body;
}

// Notifikasi di iPhone
$notify(
  "SET MALIK AKTIF",
  "Target: " + targetTotal + " | Actual: " + totalActual,
  "Dadu: " + diceValues.join(" ")
);

$done({ body: modified });
