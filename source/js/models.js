
persistence.store.websql.config(persistence, 'Teambox', 'Teambox local storage', 50 * 1024 * 1024);
persistence.search.config(persistence, persistence.store.websql.sqliteDialect);
persistence.debug = false;

//Define 
var FilesDB = persistence.define('FilesDB', {
  description: "TEXT",
  download: "TEXT", 
  bytes: "INT",
  updated_at: "TEXT",
  filename: "TEXT",
  remote_id: "INT",
  time_synced: "INT"
});
FilesDB.index('remote_id',{unique:true});
FilesDB.textIndex('filename');
FilesDB.textIndex('description');

var TasksDB = persistence.define('TasksDB', {
  task: "TEXT",
  first_comment: "TEXT", 
  updated_at: "TEXT",
  project: "TEXT",
  project_link: "TEXT",
  remote_id: "INT",
  time_synced: "INT"
});
TasksDB.index('remote_id',{unique:true});
TasksDB.textIndex('task');
TasksDB.textIndex('first_comment');
TasksDB.textIndex('project');

var ConversationsDB = persistence.define('ConversationsDB', {
  conversation: "TEXT",
  first_comment: "TEXT", 
  updated_at: "TEXT",
  project: "TEXT",
  project_link: "TEXT",
  remote_id: "INT",
  time_synced: "INT"
});
ConversationsDB.index('remote_id',{unique:true});
ConversationsDB.textIndex('conversation');
ConversationsDB.textIndex('first_comment');
ConversationsDB.textIndex('project');

persistence.schemaSync();