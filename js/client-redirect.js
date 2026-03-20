/* =============================================
   maji client-redirect — checks that the visitor
   authenticated via the client portal (clients.html).

   Usage: replace auth-gate.js on client pages:
     <script src="../js/client-redirect.js"
             data-password-hash="CLIENT_HASH"></script>

   If the stored client hash doesn't match, bounces
   the visitor to /clients.html.
   ============================================= */

(function () {
  'use strict';

  var scriptTag = document.currentScript;
  var HASH = scriptTag?.getAttribute('data-password-hash') || '';
  var SESSION_KEY = 'maji_client_auth';

  if (sessionStorage.getItem(SESSION_KEY) === HASH) return;

  // Not authenticated for this client — send to the client portal
  window.location.replace('/clients.html');
})();
