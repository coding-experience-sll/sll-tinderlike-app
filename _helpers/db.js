const config = require("config.js");
const mongoose = require("mongoose");
const connectionOptions = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};
mongoose.connect(
  config.connectionString || "mongodb://localhost/vayaAPP",
  connectionOptions
);
mongoose.Promise = global.Promise;

module.exports = {
  User: require("../users/user.model"),
  Profile: require("../profiles/profile.model"),
  Chat: require("../chats/chat.model"),
  Message: require("../messages/message.model"),
  Admin: require("../admin/admin.model"),
  Client: require("../clients/client.model"),
  Event: require("../events/event.model"),
};

//db connect parameters. nothing crazy, just basic connection parameters to avoid any deprecated errors, connects to local DB. for an external server, indicate proper URI
