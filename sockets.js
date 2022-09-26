const chatService = require("./chats/chat.service");
const messageService = require("./messages/message.service");
const userService = require("./users/user.service");
const sessionStore = require("./sessionStorage");
const jwt = require("jsonwebtoken");
const db = require("_helpers/db");
const Profile = db.Profile;

const Sockets = (io) => {
  //middleware jwt
  io.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;

    if (sessionID) {
      //console.log('here')//en la consola de la app cuando la corres por expo, estos console logs deberian aparecer una vez logueado
      // find existing session
      const session = sessionStore.findSession(sessionID);
      if (session) {
        socket.sessionID = sessionID;
        socket.userID = session.userID;
        return next();
      }
    }
    const token = socket.handshake.auth.token;

    const user_id = jwt.verify(
      token,
      process.env.JWT_SECRET,
      (err, decoded) => {
        if (err) return null;
        return decoded.sub;
      }
    );

    if (!user_id) {
      return next(new Error("Invalid user"));
    }

    // create new session
    // socket.sessionID = randomId();
    socket.sessionID = user_id;
    socket.userID = user_id;
    next();
  });

  //desde aca conexion

  io.on("connection", async (socket) => {
    //console.log("A user has connected", socket.id);
    // persist session
    sessionStore.saveSession(socket.sessionID, {
      userID: socket.userID,
      connected: true,
      socketID: socket.id,
    });
    //console.log("ESTO SON TODAS LAS SESIONES", sessionStore.findAllSessions());

    // emit session details
    socket.emit("session", {
      sessionID: socket.sessionID,
      userID: socket.userID,
    });

    // join the "userID" room
    socket.join(socket.userID);

    // fetch existing users
    const users = [];
    const chats = await chatService.getChats(socket.userID);

    sessionStore.findAllSessions().forEach((session) => {
      users.push({
        userID: session.userID,
        connected: session.connected,
        socketID: session.socketID,
      });
    });
    socket.emit("users", users);

    socket.emit("chats", chats);

    // notify existing users
    socket.broadcast.emit("user connected", {
      userID: socket.userID,
      connected: true,
      socketID: socket.id,
    });

    socket.on("chat pagination", async ({ sender , receiver, page }) => {
      const chat = await chatService.getChat(sender, receiver, page);
      if (chat.messages.length > 0) {
        socket.emit("chat pagination",  {
          chatId : chat._id,
          messages : chat.messages
        } );
      }
    });

    socket.on("private message", async ({ receiver, text }) => {
      // search for an existing chat
      const foundChat = await chatService.newChat(socket.userID, receiver);

      if (foundChat.chat) {
        // if chat exists creates a new message
        const newMessage = await messageService.newMessage(
          foundChat.chat._id,
          socket.userID,
          text
        );

        if (newMessage) {

          const users = await Profile.find({ user_id: { $in : [socket.userID, receiver]} });

          let myUserIndex = users.findIndex(p => p.user_id == socket.userID);

          let myUser;

          if (myUserIndex != -1) myUser = users[myUserIndex];

          let otherUserIndex = users.findIndex(p => p.user_id == receiver);

          let otherUser;

          if (otherUserIndex != -1) otherUser = users[otherUserIndex];

          const dataParams = { //agregar path, debe ser asi: 'chat/:user_name'

            path : 'chat/' +  receiver,
            receiver: receiver,
            chatId: foundChat.chat._id,
            body_message: newMessage.text,
            userChat: ({
              last_name : myUser.last_name,
              name : myUser.name,
              profile_photo : myUser.profile_photo,
              user_id : myUser.user_id
            }),
            sender_photo: myUser.profile_photo,
            sender_name: myUser.name + ' ' + myUser.last_name,
            sender_id: socket.userID

          }

          //.body_message.console.log('dataparams : ',dataParams)

          
          
          // if the message is created with successfully check if the receiver session is online

          const isOnline = sessionStore
            .findAllSessions()
            .filter((item) => item.userID === receiver);

          // add the new message to the chat and save
          foundChat.chat.messages = [
            ...foundChat.chat.messages,
            newMessage._id,
          ];
          await foundChat.chat.save();

          // if receiver session exists and is online check if the chat
          // existed before or was created with this message
          if (isOnline.length > 0 && isOnline[0].connected) {
            // console.log("Its online!!", isOnline[0]);

            // if chat was created for this message (first message in a conversation)
            if (foundChat.new) {
              //find the updated chat with the correct info (populated/selected fields) to emit
              const updatedChat = await chatService.getChat(
                socket.userID,
                receiver
              );

              // emit the new chat event with the updated chat to receiver and also the sender
              // supposedly should be able to emit both events at once, but its not working for me
              // so i send to sender and receiver separately
              socket
                .to(isOnline[0].socketID)
                // .to(socket.id)
                .emit("new chat", updatedChat);
              socket.emit("new chat", updatedChat);
            } else {
              // if chat already existed before this message
              // filter only the fields that are needed to be sent of the message
              const auxMsg = {
                createdAt: newMessage.createdAt,
                sender: newMessage.sender,
                text: newMessage.text,
                chatId: newMessage.chatId,
              };
              // emit the filtered message to receiver and sender (separately for the reason explained above)
              socket
                .to(isOnline[0].socketID)
                // .to(socket.id)
                .emit("private message", auxMsg);
              socket.emit("private message", auxMsg);
            }
          } else {
            //console.log("Not online");
            // same as above but since the receiver isnt online we only emit events to the sender
            if (foundChat.new) {
              //find the updated chat with the correct info (populated/selected fields) to emit
              const updatedChat = await chatService.getChat(
                socket.userID,
                receiver
              );

              socket.emit("new chat", updatedChat);
            } else {
              const auxMsg = {
                createdAt: newMessage.createdAt,
                sender: newMessage.sender,
                text: newMessage.text,
                chatId: newMessage.chatId,
              };
              socket.emit("private message", auxMsg);
            }
          }

          const notification = await userService.newMessagePush(receiver, dataParams);

          //console.log('notification : ', notification);

        }
      } else return new Error("An error has occurred");
    });

    // notify users upon disconnection
    socket.on("disconnect", async () => {
      //console.log("A user has disconnected");
      //console.log("esto es fetchsockets ", await io.fetchSockets());
      const matchingSockets = await io.in(socket.userID).fetchSockets();
      //console.log("ESTO ES MATCHING SOCKETS", matchingSockets);
      const isDisconnected = matchingSockets.length === 0;

      if (isDisconnected) {
        // notify other users
        socket.broadcast.emit("user disconnected", socket.userID);
        // update the connection status of the session
        sessionStore.saveSession(socket.sessionID, {
          userID: socket.userID,
          connected: false,
        });
      }
    });
  });
};

module.exports = Sockets;
