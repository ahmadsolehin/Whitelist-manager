/*
 * Whitelist
 *
 * A tiny Chrome extension to only let through requests to a given whitelist
 * of domains/URL regex patterns. The intention is to make this source code as interpretable
 * and small as possible so that it is reasonable to expect all users of this extension to read
 * and understand the entire thing. The entire JavaScript for this extension, including comments,
 * is under 250 lines.
 *
 * (It would otherwise be irresonsible of the user to give
 * an extension so much power over their browsing.)
 *
 * After reading this file, read `popup.js`.
 *
 * In this file is described:
 *  1. The main endpoint that blocks requests not on the whitelist
 *  2. Code for parsing the configuration file and URLs to determine what to let through
 *  3. Functions for setting and unsetting the "permit" flag that allows user to temporarily allow
 *     all requests
 */

var allowed_urls = []; // List of whitelist matching functions for URLs
var blocked_urls = []; // List of recently blocked URLs
var current_mode = 'forbid'; // Flag allowing user to temporarily permit all URLs. Can also be "permit"

/*
 * 1. MAIN ENDPOINT.
 * ================
 *
 * We bind to the onBeforeRequest listener.
 */
chrome.webRequest.onBeforeRequest.addListener(
  (info) => {
    // If we are in "permit" mode, then we allow everything. We also allow anything from
    // the local filesystem.
    var is_allowed = (current_mode === 'permit');

    // allowed_urls will be an array of functions that return true or false.
    // Other than filesystem urls, we allow only urls from this array.
    is_allowed = is_allowed || allowed_urls.some((x) => {return x(info.url);});

    // If we disallowed a url, record this so that you can see.
    if (!is_allowed) blocked_urls.push(info.url)

    // Returning 'cancel' cancels the request; do so
    // if we don't allow this.
    return {'cancel': !is_allowed}
  },

  // We need to watch every URL on http or https.
  {urls: ['http://*/*', 'https://*/*']},

  // We need permission to block requests.
  ['blocking']
);

/*
 * 2. PARSING CONFIG & URLS
 * ========================
 *
 * We need to know how to: (1) extract domains from urls
 * and (2) parse the configuration file.
 */

// 2.1. Extracting a domain from a URL
function get_domain (url) {
  // This regex matches: {protocol}   {username:password@}?{domain}
  var match = url.match(/^https?:\/\/([^:@\/]*:?[^:@\/]*@)?([a-zA-Z0-9-\.]*)/);
  if (match != null) return match[2];
}

// 2.2. Parsing the configuration format. This returns an array of
// functions which return true for matches and false for non-matches.
function get_allowed_urls (config) {

  // Strip whitespace and comments.
  config = config.split('\n').map(function(x) {
    return x.trim();
  }).filter(function(x) {
    return x.length > 0 && x[0] != '#';
  });

  // Each remaining line is the configuration for one matching
  // function.
  return config.map(function(x) {
    // Two kinds of configuartion elements:

    // (a) regex, matching the entire URL except the protocol, which
    // begin with '/' and follow Javascript Regex syntax.
    if (x[0] == '/') {
      return (url) => {
        // Pad with possible protocols and force matching the entire URL
        return url.match(new RegExp('^https?:\/\/' + x.slice(1) + '([\?#].*)?$')) != null;
      };

    // (b) domains; any other kind of line.
    } else {
      return (url) => { return get_domain(url) === x; };
    }

  });
}

/*
 * 2.3 Load and parse configuration file, and watch for changes to the configuration
 * file (loading and parsing whenever it changes).
 */

// Loading exiting config
chrome.storage.local.get('allowed_urls', function (data) {
  allowed_urls = get_allowed_urls(data['allowed_urls']);
});

// Watch for changes to the config
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === 'local' && (changes['allowed_urls'] != null))
    allowed_urls = get_allowed_urls(changes['allowed_urls'].newValue);
});

/*
 * 3. "PERMIT" MODE.
 * =================
 *
 * Permit mode is controlled by the "current_mode" flag and
 * can be set to "permit" at one minute increments. TODO: change the icon to something red
 * when in permit mode as well.
 */
unset_permit_timeout = null;

// To go back to forbid mode, both cancel the timeout and also
// set the flag.
function unset_permit () {
  current_mode = 'forbid';
  if (unset_permit_timeout != null) {
    clearTimeout(unset_permit_timeout);
    unset_permit_timeout = null;
  }
}

// To set permit mode, set a timeout to confirm staying in it,
// and also set the flag.
function set_permit () {
  if (unset_permit_timeout != null)
    clearTimeout(unset_permit_timeout);

  // Set the flag.
  current_mode = 'permit';

  // Set timeout to only permit for 1 minute at a time.
  unset_permit_timeout = setTimeout(
    () => {
      if (confirm('You are in whitelist permit mode. Continue in permit mode?')) {
        set_permit();
      } else {
        unset_permit();
      }
    },
    1000 * 60
  );
}
