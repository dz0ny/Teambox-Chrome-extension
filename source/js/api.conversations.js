Conversations = function(client) {
  this.init(this, client);        
}

Conversations.prototype = {
  init: function(self, client){
    self.client = client;
    self.urly = "tb://conversation/";
    self.sync(self);
  },
  sync: function(self){
    if (!self) {  
      var self = this;
    };
    self.client.get("/api/1/conversations.json", function(data, status) {
      if (status == 200) {
        self.time_synced = (new Date).getTime();
        self.new_conversations = 0;

        console.log("run CONVERSATINS", self.new_conversations, (new Date).getTime())

        //Simple ORM manager
        var comments_ids = [];
        var comments_texts = [];
        var projects_ids = [];
        var projects_names= [];
        var projects_links= [];
        var projects_actives= [];
        for (var i = data.references.length - 1; i >= 0; i--){
          var ref = data.references[i];
          if (ref.type == "Comment") {
            comments_ids.push(ref.id);
            comments_texts.push(ref.body);
          }
          if (ref.type == "Project") {
            projects_ids.push(ref.id);
            projects_names.push(ref.name);
            projects_links.push(ref.permalink);
            projects_actives.push(ref.archived);
          }
        }

        data.objects.forEach(function(conversation, index, conversations) {
         ConversationsDB.findBy("remote_id", conversation.id, function(result) {
            if (result) {
              if (!projects_actives[projects_ids.indexOf(conversation.project_id)]) {
                var entry = new ConversationsDB();
                entry.updated_at = conversation.updated_at;
                entry.time_synced = self.time_synced;
                entry.first_comment = self._clean(comments_texts[comments_ids.indexOf(conversation.first_comment_id)]);
                entry.conversation = self._clean(conversation.name);
              } else{
                persistence.remove(result);
              }
             }else{
              //Project isn't archived
              if (!projects_actives[projects_ids.indexOf(conversation.project_id)]) {
                //If new task
                var entry = new ConversationsDB();
                entry.remote_id = conversation.id;
                entry.project = projects_names[projects_ids.indexOf(conversation.project_id)];
                entry.project_link = projects_links[projects_ids.indexOf(conversation.project_id)];
                entry.updated_at = conversation.updated_at;
                entry.time_synced = self.time_synced;
                entry.first_comment = self._clean(comments_texts[comments_ids.indexOf(conversation.first_comment_id)]);
                entry.conversation = self._clean(conversation.name);
                persistence.add(entry);
                self.new_conversations += 1;
              };
            }
            //end of tasks
            if (index == conversations.length-1) {

              persistence.flush();

              //delete old tasks
              ConversationsDB.all().filter("time_synced", "=!", self.time_synced).destroyAll(function(count){
                console.log("end CONVERSATIONS", self.new_conversations, (new Date).getTime())
                //notify
                if (self.new_conversations > 0) {
                  self.client.notify(self.new_conversations + " new converstions, have been added to Teambox, since last time.");
                }
              });
            }
          });   
        });
      }
    })
  },
  _clean: function(text){
    return text?text.replace(/[\t\r\n]/ig, "").replace(/<.*?>/ig,""):"";
  },
  SuggestResult: function(conversation) {
    var data = {};

    data.content =  this.urly + conversation.remote_id;

    if (!conversation.first_comment.length) {
      data.description =  "<dim>Conversation in </dim>" + conversation.project + " <match>"+ conversation.conversation + "</match>";
    }else{
      data.description =  "<dim>Conversation in </dim>" + conversation.project + " <match>"+ conversation.conversation + "</match> <url>" + conversation.first_comment + "</url>";
    }

    return data;
  },
  search: function(text, callback){
    var self = this;
    ConversationsDB.search(text).limit(2).list(function(results) {
      var data = [];
      if (results) {
        results.forEach(function(entry, index, items) {
          data.push( self.SuggestResult(entry) )
          if (index == items.length-1) {
            callback(data);
          }
        });
        }else{
          callback(data);
        }
    });
  },
  resolve: function(url , callback){
    var self = this;
    ConversationsDB.findBy("remote_id", url.replace(this.urly,""), function(result) {
      if (result) {
        callback("Conversation", self.client.domain + "/projects/" + result.project_link +  "/conversations/" + result.remote_id);
      }else{
        callback(false);
      }
    });
  }
}