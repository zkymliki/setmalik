// ==UserScript==
// @name         Remote KB by Kaurev (SET MALIK v21)
// @version      21.0
// @description  Remote Control Google Dice Roller via Firebase (Hybrid No-CORS Engine)
// @author       Kaurev & Antigravity
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // Batasi eksekusi hanya pada domain Google Search
  const currentDomain = window.location.hostname;
  if (!currentDomain.includes("google.com") && !currentDomain.includes("google.co.id")) {
    return;
  }

  const FIREBASE_URL = "https://setkbojeng-default-rtdb.asia-southeast1.firebasedatabase.app/8092122107.json";
  
  const _o = Math.random.bind(Math);
  let _q = [];
  let _activeTarget = null;
  let _justClicked = false;
  let _isRolling = false;
  let _clickTimeout = null;
  let _rollTimeout = null;
  const isIframe = (window.self !== window.top);

  // Formula konversi nilai dadu 1-6 ke range Math.random()
  function r2d(v) {
    return (v - 1) / 6 + 0.03;
  }

  // Pembagian nilai target ke N dadu secara adil
  function dist(t, n) {
    t = Math.max(n, Math.min(n * 6, parseInt(t)));
    let a = [], i, rem, s = 0;
    for (i = 0; i < n; i++) a.push(1);
    rem = t - n;
    while (rem > 0 && s++ < 99999) {
      i = Math.floor(_o() * n);
      if (a[i] < 6) {
        a[i]++;
        rem--;
      }
    }
    return a;
  }

  // Deteksi jumlah dadu aktif di layar (menembus Shadow DOM Google)
  function nDice() {
    let count = 0;
    try {
      const roots = Array.from(document.querySelectorAll("*")).filter(el => el.shadowRoot);
      roots.forEach(root => {
        const canvasList = root.shadowRoot.querySelectorAll("canvas");
        if (canvasList.length > 0) count = canvasList.length;
      });
    } catch(e) {}
    return count > 0 ? count : 3; // Fallback ke 3 dadu jika gagal deteksi
  }

  // Reset Firebase ke null
  function resetFirebase() {
    fetch(FIREBASE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: '{"target":null}'
    }).catch(() => {});
  }

  // Pancarkan target ke semua frame (untuk sinkronisasi bypass CORS)
  function broadcastTarget(target) {
    try {
      // Kirim ke semua iframe anak
      const iframes = document.querySelectorAll("iframe");
      iframes.forEach(f => {
        f.contentWindow.postMessage({ type: "SET_TARGET", target: target }, "*");
      });
    } catch(e) {}
    try {
      // Kirim ke parent window jika kita berada di dalam iframe
      if (isIframe) {
        window.parent.postMessage({ type: "SET_TARGET", target: target }, "*");
      }
    } catch(e) {}
  }

  // Pancarkan sinyal reset
  function broadcastReset() {
    try {
      if (isIframe) {
        window.parent.postMessage({ type: "RESET_TARGET" }, "*");
      } else {
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach(f => {
          f.contentWindow.postMessage({ type: "RESET_TARGET" }, "*");
        });
      }
    } catch(e) {}
  }

  // Pasang listener pesan komunikasi antar-frame
  window.addEventListener("message", function(e) {
    if (e.data) {
      if (e.data.type === "SET_TARGET") {
        _activeTarget = e.data.target;
      }
      if (e.data.type === "RESET_TARGET") {
        // Hapus target secara lokal
        _activeTarget = null;
        _q = [];
        // Jika kita parent (punya akses CORS), bantu bersihkan database Firebase
        if (!isIframe) {
          resetFirebase();
        }
      }
    }
  });

  // Polling database Firebase secara berkala
  function poll() {
    if (_isRolling) return;
    fetch(FIREBASE_URL + "?nc=" + Date.now())
      .then(r => r.json())
      .then(d => {
        const target = (d && d.target !== null && d.target !== undefined) ? d.target : null;
        _activeTarget = target;
        broadcastTarget(target);
      })
      .catch(() => {
        // Polling gagal (CORS block di iframe). Abaikan, kita akan menerima data via postMessage.
      });
  }

  setInterval(poll, 800);
  setTimeout(poll, 50);

  // Deteksi klik global cerdas dengan composedPath filter
  function checkClick(e) {
    if (_isRolling) return;
    const path = e.composedPath ? e.composedPath() : [];
    let isAddDiceClick = false;
    let isClearClick = false;

    for (let i = 0; i < path.length; i++) {
      const el = path[i];
      if (!el) continue;
      if (el.innerText) {
        const txt = el.innerText.trim().toLowerCase();
        if (/^(d4|d6|d8|d10|d12|d20|\+|-)$/.test(txt)) {
          isAddDiceClick = true;
        }
        if (txt === "hapus" || txt === "clear" || txt === "reset") {
          isClearClick = true;
        }
      }
      if (el.getAttribute) {
        const aria = el.getAttribute("aria-label") ? el.getAttribute("aria-label").toLowerCase() : "";
        if (aria.includes("d4") || aria.includes("d6") || aria.includes("d8") || aria.includes("d10") || aria.includes("d12") || aria.includes("d20")) {
          isAddDiceClick = true;
        }
        if (aria.includes("clear") || aria.includes("hapus")) {
          isClearClick = true;
        }
      }
    }

    if (!isAddDiceClick && !isClearClick) {
      _justClicked = true;
      if (_clickTimeout) clearTimeout(_clickTimeout);
      _clickTimeout = setTimeout(() => { _justClicked = false; }, 2500);
    }
  }

  window.addEventListener("mousedown", checkClick, true);
  window.addEventListener("touchstart", checkClick, true);

  // Hijack Math.random secara universal di semua context
  Math.random = function() {
    if (_justClicked && !_isRolling) {
      if (_activeTarget !== null && _activeTarget !== undefined) {
        const n = nDice();
        const vals = dist(_activeTarget, n);
        _q = vals.map(r2d);
        _isRolling = true;
        _justClicked = false;
        
        // Bersihkan database Firebase
        resetFirebase();
        broadcastReset();
        _activeTarget = null;

        // Kunci target selama 4 detik penuh agar animasi selesai
        if (_rollTimeout) clearTimeout(_rollTimeout);
        _rollTimeout = setTimeout(() => {
          _isRolling = false;
          _q = [];
        }, 4000);
      }
    }

    if (_isRolling && _q.length > 0) {
      return _q.shift();
    }
    return _o();
  };

})();