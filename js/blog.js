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

  // ── Auth ──
  var MASTER_SALT = '::rayna-blog-salt';
  var MASTER_PASSWORD = 'Cxy20111010';
  var MASTER_HASH = btoa(MASTER_PASSWORD + MASTER_SALT).substring(0, 32);

  var STORED_HASH_KEY = 'blog-passhash';

  function getStoredHash() {
    return localStorage.getItem(STORED_HASH_KEY);
  }

  function hashPassword(password) {
    return btoa(password + MASTER_SALT).substring(0, 32);
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

      var inputHash = hashPassword(pw);
      var storedHash = getStoredHash();

      // First-time setup
      if (!storedHash) {
        localStorage.setItem(STORED_HASH_KEY, MASTER_HASH);
        storedHash = MASTER_HASH;
      }

      // Check against stored hash or master hash
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
