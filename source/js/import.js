
(function(window, undefined) {
"use strict";
  chrome.browserAction.setBadgeText({text:"..."})
  chrome.browserAction.setBadgeBackgroundColor({color:[55, 180, 180, 255]})
  window.Teambox = new Client("https://teambox.com");

})(window);
