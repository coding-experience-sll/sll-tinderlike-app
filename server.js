require("rootpath")();
require("dotenv").config();

const express = require("express");
const app = express();
const morgan = require("morgan");
const server = require("http").createServer(app);
const Sockets = require("./sockets");
const io = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("_helpers/jwt");
const errorHandler = require("_helpers/error-handler");

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());

// use JWT auth to secure the api
app.use(jwt());

// api routes
app.use("/api/users", require("./users/users.controller"));
app.use("/api/profiles", require("./profiles/profiles.controller"));
app.use("/api/admin", require("./admin/admin.controller"));
app.use("/api/clients", require("./clients/clients.controller"));
app.use("/api/events", require("./events/events.controller"));
app.use("/api/chats", require("./chats/chats.controller"));
// app.use("/api/messages", require("./messages/messages.controller"));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.PORT || 3001;

const httpServer = server.listen(port, function () {
  console.log("Server running on port " + port);
});

const io_server = io(httpServer, { cors: { origin: "*" } });

Sockets(io_server);
