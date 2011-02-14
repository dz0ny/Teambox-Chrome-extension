Client = function(domain){
  this.init(this, domain);
}
Client.prototype = {
  init: function(self, domain){
    localStorage.domain = domain
    self.domain = domain;
    self.getLoginURL =  {
      "url" : this.domain+"/login",
      "selected" : true
    }
    self.get("/api/1/account.json", function(data, status) {
      self.User = Object.create(data);
      Object.freeze(self.User);
      self.sync(self);
    })
  },
  sync: function(self){
    chrome.omnibox.setDefaultSuggestion(SuggestResult("Teambox"));
    self.Files = new Files(this);
    self.Tasks = new Tasks(this);
    self.Conversations = new Conversations(this);
    setTimeout(function() {
         self.sync(self);
    }, 1000*60*5); // 5 minutes
  },
  newLogin: function(){
    var self = this;
    if (!this.loginTab) { 
     chrome.tabs.create( this.getLoginURL, function(tab) {
       self.loginTab = tab;

       chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
        if (self.loginTab && self.loginTab.id == tabId) {
          delete self.loginTab;
        }
       });
       setTimeout(function() {
         self.init(self, self.domain)
       }, 5000);

     });
   }
  },
  get: function(url, callback) {

    var self = this;//I know, not jquery style, but might be confusing for someone

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (this.status == 200) {
        if (url.indexOf(".json") != -1) {
          callback(JSON.parse(this.response), this.status);
        }else{
          callback(this.response, this.status);
        }
      }else{
        self.newLogin();
      }
    };
    xhr.open("GET", this.domain+url);
    xhr.send();
  },
  post: function(url, form, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      callback(this.response);
    };
    xhr.open("POST", this.domain+url);
    xhr.send(form);
  },
  log: function(data, status) {
    console.log(" ","status",status)
    console.log(" ", "data",data)
  },
  notify: function(text){
    var notification = webkitNotifications.createNotification(
      "/ikona128.png",
      'Teambox',
      text
    );
    notification.show();
    
    var notificationTimer =  setTimeout(function() {
      notification.cancel();
    }, 5000);

    notification.onclose = function(event) {
      clearTimeout(notificationTimer);
    };
  }
}  