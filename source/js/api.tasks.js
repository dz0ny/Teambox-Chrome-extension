Tasks = function(client) {
  this.init(this, client);        
}

Tasks.prototype = {
  init: function(self, client){
    self.client = client;
    self.urly = "tb://task/";
    self.sync(self);
  },
  sync: function(self){
    if (!self) {  
      var self = this;
    };
    self.client.get("/api/1/tasks.json", function(data, status) {
      if (status == 200) {
        self.time_synced = (new Date).getTime();
        self.new_tasks = 0;

        console.log("run TASKS", self.new_tasks, (new Date).getTime())

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

        data.objects.forEach(function(task, index, tasks) {
          TasksDB.findBy("remote_id", task.id, function(result) {
            if (result) {
              if (!projects_actives[projects_ids.indexOf(task.project_id)]) {
                var entry = new TasksDB();
                entry.updated_at = task.updated_at;
                entry.time_synced = self.time_synced;
                entry.first_comment = self._clean(comments_texts[comments_ids.indexOf(task.first_comment_id)]);
                entry.task = self._clean(task.name);
              } else{
                persistence.remove(result);
              }
             }else{
              //Project isn't archived
              if (!projects_actives[projects_ids.indexOf(task.project_id)]) {
                //If new task
                var entry = new TasksDB();
                entry.remote_id = task.id;
                entry.project = projects_names[projects_ids.indexOf(task.project_id)];
                entry.project_link = projects_links[projects_ids.indexOf(task.project_id)];
                entry.updated_at = task.updated_at;
                entry.time_synced = self.time_synced;
                entry.first_comment = self._clean(comments_texts[comments_ids.indexOf(task.first_comment_id)]);
                entry.task = self._clean(task.name);
                persistence.add(entry);
                self.new_tasks += 1;
              };
            }
            //end of tasks
            if (index == tasks.length-1) {

              persistence.flush();

              //delete old tasks
              TasksDB.all().filter("time_synced", "=!", self.time_synced).destroyAll(function(count){
                console.log("end TASKS", self.new_tasks, (new Date).getTime())
                //notify
                if (self.new_tasks > 0) {
                  self.client.notify(self.new_tasks + " new tasks, have been added to Teambox, since last time.");
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
  SuggestResult: function(task) {
    var data = {};

    data.content =  this.urly + task.remote_id;

    if (!task.first_comment.length) {
      data.description =  "<dim>Task in </dim>" + task.project + " <match>"+ task.task + "</match>";
    }else{
      data.description =  "<dim>Task in </dim>" + task.project + " <match>"+ task.task + "</match> <url>" + task.first_comment + "</url>";
    }

    return data;
  },
  search: function(text, callback){
    var self = this;
    TasksDB.search(text).limit(2).list(function(results) {
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
    TasksDB.findBy("remote_id", url.replace(this.urly,""), function(result) {
      if (result) {
        callback("Task", self.client.domain + "/projects/" + result.project_link +  "/tasks/" + result.remote_id);
      }else{
        callback(false);
      }
    });
  }
}