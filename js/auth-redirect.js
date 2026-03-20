/* =============================================
   maji auth-redirect — bounces unauthenticated
   visitors to the protected tools portal.

   Usage: add to any protected tool page's <head>:
     <script src="js/auth-redirect.js"></script>
     — or from a subfolder —
     <script src="../js/auth-redirect.js"></script>

   Works with auth-gate.js session — once a user
   has authenticated on protected-tools.html they
   can freely access any page using this script.
   ============================================= */

(function () {
  'use strict';

  // Must match the hash used by auth-gate.js (sha256 of "maji2024")
  var HASH = '5966b4dd75d2433be589e3875cb7cc36025b8b9f9307a08be600b2bb173e4773';
  var SESSION_KEY = 'maji_auth';

  if (sessionStorage.getItem(SESSION_KEY) === HASH) return;

  // Build path to protected-tools.html relative to the current page
  var depth = window.location.pathname.replace(/\/[^/]*$/, '').split('/').length - 1;
  var base = window.location.pathname.split('/').slice(0, -1);
  // Find how many levels deep we are from the site root
  var scriptEl = document.currentScript;
  var prefix = '';
  if (scriptEl && scriptEl.getAttribute('src').indexOf('../') === 0) {
    prefix = '../';
  }

  window.location.replace(prefix + 'protected-tools.html');
})();
