// ==UserScript==
// @name         SET MALIK Google Dice Remote v19
// @namespace    https://github.com/zkymliki/setmalik
// @version      19.0
// @description  Remote Control Google Dice Roller via Firebase (Bypass CDN & VPN)
// @author       Antigravity
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // Hanya jalankan script jika berada di halaman Google Search
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

  // Menampilkan toast notifikasi cantik bergaya glassmorphism di halaman web
  function showToast(title, desc) {
    const initToast = () => {
      if (!document.body) {
        setTimeout(initToast, 100);
        return;
      }
      
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.top = '30px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      toast.style.zIndex = '9999999';
      toast.style.background = 'rgba(15, 23, 42, 0.85)';
      toast.style.backdropFilter = 'blur(12px)';
      toast.style.webkitBackdropFilter = 'blur(12px)';
      toast.style.border = '1px solid rgba(255, 255, 255, 0.15)';
      toast.style.borderRadius = '16px';
      toast.style.padding = '12px 24px';
      toast.style.color = '#fff';
      toast.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)';
      toast.style.display = 'flex';
      toast.style.flexDirection = 'column';
      toast.style.alignItems = 'center';
      toast.style.gap = '4px';
      toast.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      toast.style.opacity = '0';
      toast.style.pointerEvents = 'none';

      const titleEl = document.createElement('span');
      titleEl.innerText = title;
      titleEl.style.fontWeight = 'bold';
      titleEl.style.fontSize = '14px';
      titleEl.style.color = '#38bdf8'; // Sky blue accent

      const descEl = document.createElement('span');
      descEl.innerText = desc;
      descEl.style.fontSize = '12px';
      descEl.style.color = '#94a3b8';

      toast.appendChild(titleEl);
      toast.appendChild(descEl);
      document.body.appendChild(toast);

      // Animasi Fade In
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      }, 100);

      // Fade Out setelah 4 detik
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
      }, 4000);
    };
    initToast();
  }

  // Tampilkan notifikasi saat script pertama kali jalan di Google
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      showToast("🎲 SET MALIK v19", "Userscript Aktif - Menunggu lemparan...");
    });
  } else {
    showToast("🎲 SET MALIK v19", "Userscript Aktif - Menunggu lemparan...");
  }

  // Deteksi klik lempar secara global dengan filter
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

  // Hijack Math.random
  Math.random = function() {
    if (_justClicked && !_isRolling) {
      if (_activeTarget !== null && _activeTarget !== undefined) {
        const n = nDice();
        const vals = dist(_activeTarget, n);
        _q = vals.map(r2d);
        _isRolling = true;
        _justClicked = false;
        
        // Hapus target di Firebase agar tidak double roll
        fetch(FIREBASE_URL, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: '{"target":null}'
        }).catch(() => {});
        
        _activeTarget = null;

        // Kunci target selama 4 detik penuh untuk visual animation
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

  // Polling Firebase secara berkala
  function poll() {
    if (_isRolling) return;
    fetch(FIREBASE_URL + "?nc=" + Date.now())
      .then(r => r.json())
      .then(d => {
        if (d && d.target !== null && d.target !== undefined) {
          _activeTarget = d.target;
        } else {
          _activeTarget = null;
        }
      })
      .catch(() => {});
  }

  setInterval(poll, 800);
  setTimeout(poll, 50);

})();
