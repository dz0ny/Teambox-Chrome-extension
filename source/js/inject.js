	var css = document.createElement('link');
	css.rel = 'stylesheet';
	css.href = chrome.extension.getURL('css/still.css');
	css.type = 'text/css';
	css.media = 'all';

	var d = document.documentElement.lastChild;
	d.insertBefore(lfm, d.lastChild);