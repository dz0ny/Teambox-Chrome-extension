chrome.omnibox.setDefaultSuggestion(SuggestResult("Teambox is synchronizing..."));
chrome.omnibox.onInputChanged.addListener(
	function(text, callback) {
		Teambox.Files.search(text, callback)
		Teambox.Tasks.search(text, callback)
		Teambox.Conversations.search(text, callback)
	}
);

chrome.omnibox.onInputEntered.addListener(function(command) {
	if (!command) {
		Resolver(true, Teambox.domain)
	}else{
		Teambox.Files.resolve(command, Resolver)
		Teambox.Tasks.resolve(command, Resolver)
		Teambox.Conversations.resolve(command, Resolver)	
	}

});
function Resolver (type, url) {
	console.log(type, url)
	if (type) {
		chrome.tabs.getSelected(null, function(tab) {
			if (tab){
				chrome.tabs.update(tab.id, {
					"url":url
				});
			}else{
				chrome.tabs.create({
					"url":url
				});
			}
		});
	}
}
function SuggestResult (msg, url) {
	var data = {};

	if (url) {
		data.content =  url;
	}
	if (msg) {
		data.description =  msg;
	}

	return data;
}