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

  // Redirect to the portal page at the site root
  window.location.replace('/protected-tools.html');
})();
