/*
 * "Control panel" popup for the whitelist extension.
 *
 * Read `background.js` before reading this file.
 *
 * In this file is described:
 *  1. Code for displaying the last 50 blocked urls
 *  2. Code for making an editor for the configuration file
 *  3. Code for letting the user set and unset the 'permit mode' flag
 */

// Grab parts of the DOM
var textarea = document.getElementById('allowed_urls'),
    update = document.getElementById('update'),
    forbid = document.getElementById('forbid'),
    permit = document.getElementById('permit'),
    behavior = document.getElementById('behavior'),
    botr = document.getElementById('botr'),
    background; // Also declare this global, which will become a reference to
                // the background page.

/*
 * 1. DISPLAYING LAST 50 BLOCKED URLS
 * ===================================
 */
// Get a reference to the background page.
chrome.runtime.getBackgroundPage((b) => {
  background = b;

  // Update the mode flag display to reflec the background page's
  // current mode flag.
  behavior.innerText = background.current_mode;

  // List out the 50 most recently blocked URLs in divs.
  background.blocked_urls.slice(-50).forEach((blocked_url) => {
    var new_el = document.createElement('div');
    new_el.innerText = blocked_url;

    botr.appendChild(new_el);
  });
});

/*
 * 2. MAKING AN EDITOR FOR THE CONFIG FILE
 * =======================================
 */
// Load the current config file.
chrome.storage.local.get('allowed_urls', (data) => {
  textarea.value = data['allowed_urls'];
});

// Every time the user changes the config file edit input,
// update the config file.
textarea.addEventListener('input', () => {
  chrome.storage.local.set({'allowed_urls': textarea.value});
});

/*
 * 3. LETTING THE USER CHANGE THE 'PERMIT MODE' FLAG
 * =================================================
 */
// Add listeners for changing the 'permit mode' flag.
forbid.addEventListener('click', () => {
  if (background) {
    behavior.innerText = 'forbid';
    background.unset_permit();
  }
});
permit.addEventListener('click', () => {
  if (background) {
    behavior.innerText = 'permit';
    background.set_permit();
  }
});
