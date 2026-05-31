(function () {
  var THEME_KEY = 'blog-theme';
  var AUTH_KEY = 'blog-auth';

  // ── Theme ──
  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    var saved = localStorage.getItem(THEME_KEY);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var initial = saved || (prefersDark ? 'dark' : 'light');

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      toggle.textContent = theme === 'dark' ? '☀' : '☾';
      localStorage.setItem(THEME_KEY, theme);
    }

    setTheme(initial);

    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ── Auth (PBKDF2, irreversible) ──
  var SALT = '::rayna-blog-salt';
  var ITERATIONS = 210000;
  // Pre-computed PBKDF2-SHA256 hash of the master password.
  // The plaintext password is never stored or recoverable from this value.
  var MASTER_HASH = '19919fcef3cde0216bf56b08dce987c599b0ef1e89bbbf2d929971483f6379aa';

  var STORED_HASH_KEY = 'blog-passhash';

  function ab2hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }

  function deriveKey(password) {
    // Returns a Promise that resolves to the hex-encoded PBKDF2 digest
    var encoder = new TextEncoder();
    var keyMaterial = crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    return keyMaterial.then(function (key) {
      return crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: encoder.encode(SALT),
          iterations: ITERATIONS,
          hash: 'SHA-256'
        },
        key,
        256
      );
    }).then(function (bits) {
      return ab2hex(bits);
    });
  }

  function isUnlocked() {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  }

  function unlock() {
    sessionStorage.setItem(AUTH_KEY, '1');
    applyAuthState();
  }

  function lock() {
    sessionStorage.removeItem(AUTH_KEY);
    applyAuthState();
  }

  function toggleAuth() {
    if (isUnlocked()) {
      lock();
    } else {
      var pw = prompt('Enter password to unlock editing:');
      if (!pw) return;

      deriveKey(pw).then(function (inputHash) {
        var storedHash = localStorage.getItem(STORED_HASH_KEY);

        // First-time setup: seed with master hash
        if (!storedHash) {
          localStorage.setItem(STORED_HASH_KEY, MASTER_HASH);
          storedHash = MASTER_HASH;
        }

        if (inputHash === storedHash || inputHash === MASTER_HASH) {
          // Re-seed with master hash to keep things consistent
          if (inputHash === MASTER_HASH && storedHash !== MASTER_HASH) {
            localStorage.setItem(STORED_HASH_KEY, MASTER_HASH);
          }
          sessionStorage.removeItem('blog-fail-count');
          unlock();
        } else {
          var count = parseInt(sessionStorage.getItem('blog-fail-count') || '0', 10) + 1;
          sessionStorage.setItem('blog-fail-count', count);
          if (count >= 10) {
            alert("Don't try to change what I've written!");
          } else {
            alert('Wrong password.');
          }
        }

        // Refresh button state after async auth completes
        var btn = document.getElementById('authToggle');
        if (btn) btn.textContent = isUnlocked() ? '🔓' : '🔒';
      });
    }
  }

  function applyAuthState() {
    var unlocked = isUnlocked();
    document.documentElement.setAttribute('data-editable', unlocked ? '1' : '0');
  }

  // Insert lock button into nav
  function insertLockButton() {
    var navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.id = 'authToggle';
    btn.title = 'Toggle edit mode';
    btn.setAttribute('aria-label', 'Toggle edit mode');
    btn.textContent = isUnlocked() ? '🔓' : '🔒';
    btn.style.marginLeft = '-0.3rem';

    btn.addEventListener('click', function () {
      toggleAuth();
      btn.textContent = isUnlocked() ? '🔓' : '🔒';
    });

    // Insert before the theme toggle
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      navLinks.insertBefore(btn, themeBtn);
    } else {
      navLinks.appendChild(btn);
    }
  }

  // Init
  applyAuthState();
  insertLockButton();

  // Listener system for other scripts to react to auth changes
  var authListeners = [];

  function onAuthChange(fn) {
    authListeners.push(fn);
  }

  function notifyListeners() {
    var unlocked = isUnlocked();
    for (var i = 0; i < authListeners.length; i++) {
      authListeners[i](unlocked);
    }
  }

  // Override lock/unlock to notify
  var _unlock = unlock;
  var _lock = lock;
  unlock = function () { _unlock(); notifyListeners(); };
  lock   = function () { _lock();   notifyListeners(); };

  // Expose to other scripts
  window.__blogAuth = {
    isUnlocked: isUnlocked,
    onAuthChange: onAuthChange,
    refreshUI: function () {
      var btn = document.getElementById('authToggle');
      if (btn) btn.textContent = isUnlocked() ? '🔓' : '🔒';
      applyAuthState();
      notifyListeners();
    }
  };
})();
