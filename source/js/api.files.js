Files = function(client) {
  this.init(this, client);        
}

Files.prototype = {
  init: function(self, client){
    self.client = client;
    self.urly = "tb://file/";
    self.sync(self);
  },
  sync: function(self){
    if (!self) {  
      var self = this;
    };
   
    self.client.get("/api/1/uploads.json", function(data, status) {
      if (status == 200) {
        self.time_synced = (new Date).getTime();
        self.new_files = 0;

        console.log("run FILES", self.new_files, (new Date).getTime())

        data.objects.forEach(function(file, index, files) {
          FilesDB.findBy("remote_id", file.id, function(result) {
            if (result) {
                var entry = new FilesDB();
                entry.time_synced = self.time_synced;
                entry.filename = file.filename;
                entry.download = file.download;
                entry.description = file.description?file.description.replace(/[\t\r\n]/ig, ""):"";
            }else{
              //If new file
              var entry = new FilesDB();
              entry.remote_id = file.id;
              entry.filename = file.filename;
              entry.download = file.download;
              entry.updated_at = file.updated_at;
              entry.time_synced = self.time_synced;
              entry.bytes = file.bytes;
              entry.description = file.description?file.description.replace(/[\t\r\n]/ig, ""):"";
              persistence.add(entry);
              self.new_files += 1;
            }
            //end of files
            if (index == files.length-1) {

              persistence.flush();

              //delete old files
              FilesDB.all().filter("time_synced", "=!", self.time_synced).destroyAll(function(count){
                console.log("end FILES", self.new_files, (new Date).getTime())
                //notify
                chrome.browserAction.setBadgeText({text:""})
                if (self.new_files > 0) {
                  self.client.notify(self.new_files + " new files, have been added to Teambox, since last time.");
                }
              });
            }
          });   
        });
      }
    })
  },
  _bytesToSize: function(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  },
  SuggestResult: function(file) {
    var data = {};

    data.content =  this.urly + file.remote_id;

    if (!file.description.length) {
      data.description =  "<dim>File:</dim> <match>"+ file.filename + " (" + this._bytesToSize(file.bytes)+ ")</match>";
    }else{
      data.description =  "<dim>File:</dim> <match>"+ file.filename + " (" + this._bytesToSize(file.bytes) +  ")</match> <url>" + file.description + "</url>";
    }

    return data;
  },
  search: function(text, callback){
    var self = this;
    FilesDB.search(text).limit(1).list(function(results) {
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
    FilesDB.findBy("remote_id", url.replace(this.urly,""), function(result) {
      if (result) {
        callback("File", result.download.indexOf("http")== -1?self.client.domain+result.download:result.download);
      }else{
        callback(false);
      }
    });
  }
}
