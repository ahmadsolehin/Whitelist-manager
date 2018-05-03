# Whitelist
Minimalistic whitelist extension for Chrome. This should allow you to make requests only to certain domains or only to urls matching certain regexps. Why this might be a good idea:
  - It serves (overzealously) all the same functions as adblock: less tracking, better performance on pages, less network usage, less obtrusive ads.
  - It protects you from "lookalike url" phishing attacks, since the lookalike url will be blocked by default.
  - It encourages you to be mindful of what you use the Internet for, and could make you more productive by keeping your attention focused on the urls that really matter.

Some extensions like this exist already, but this kind of extension asks for a lot of permissions (intercept every http request!), so I thought it would be best for an extension like this to be open-source and as small as possible, so that if you are wondering what it does you can just read it in a few minutes. I'd like to try to keep the entirety of the source under maybe 200 lines and have no dependencies other than Chrome.

# TODO
  - Style the popup a little better, within reason keeping the stylesheet small
  - Possibly allow whitelisting based on the requester, e.g. whitelist "google.com and everything that a google.com page requests". Don't do this if it requires too much code.
