const db = require("_helpers/db");
const Chat = db.Chat;
const User = db.User;
const Message = db.Message;
const Profile = db.Profile;
const userService = require("../users/user.service");
const compareAsc = require("date-fns/compareAsc");

module.exports = {
  newChat,
  getChats,
  partialMatch,
  getChat,
  emptyChat,
  // getChatMessages,
};

//Create a new chat

async function newChat(sender, receiver) {
  const profiles = await Profile.find({ user_id: { $in: [sender, receiver] } });

  const profilesId = profiles.map((profile) => profile._id);
  // check if it already exists
  const exists = await Chat.findOne({
    members: { $all: [sender, receiver] },
  });
  // if it exists returns an object with the existing chat and a property describing its not a new chat
  if (exists) return { new: false, chat: exists };
  // if it doesnt exists creates a new chat and returns an object with the newly created chat and
  // a property describing its a new chat
  const chat = new Chat({ members: [sender, receiver], profiles: profilesId });
  const savedChat = await chat.save();
  return { new: true, chat: savedChat };
}

// Get all user chats

async function getChats(userId) {
  const allChats = await Chat.find({ members: { $in: [userId] } })
    .select("members updatedAt")
    .populate({ path: "members", model: User, select: "name last_name" })
    .populate({
      path: "messages",
      model: Message,
      select: "sender text createdAt -_id",
      options: { perDocumentLimit: 1, sort: { updatedAt: -1 } },
    })
    .lean();
  return allChats;
}

// Get chat with specific user

async function getChat(userId, secondUserId, page) {

  

  const chat = await Chat.findOne({
    members: { $all: [userId, secondUserId] },
  })
    .select("members updatedAt emptied")
    .populate({ path: "members", model: User, select: "name last_name" })
    .populate({
      path: "messages",
      model: Message,
      select: "sender text createdAt -_id",
      options: { limit: 100, sort: { createdAt: -1 } },
    })
    .skip(100 * page)
    .lean();

  const emptied = chat.emptied;

  let userIndex;

  if (emptied) userIndex = emptied.findIndex((p) => p.userId == userId);

  let filteredMessages;

  //filteredMessages: messages <createdAt> are compared to the last time
  //the user emptied the chats. Older messages are removed

  if (userIndex > -1) {
    filteredMessages = chat.messages.filter(
      (f) => compareAsc(f.createdAt, emptied[userIndex].emptiedAt) == 1
    );
    chat.messages = filteredMessages;
  }

  return chat;
}

//search chats with people

async function partialMatch(query, token) {
  let userId = await userService.getUserId(token);

  const myProfile = await Profile.findOne({ user_id: userId });

  const users = await User.find({
    full_name: { $regex: query.input, $options: "i" },
  }); //if empty, retrieves all of the user's chats

  const usersId = users.map((user) => {
    //retrieval of all usersId regarding the query
    const id = user._id.toString();

    return id;
  });

  const userIndex = usersId.indexOf(userId); //removal of the user's own ID

  if (userIndex !== -1) usersId.splice(userIndex, 1);

  for (const blocked of myProfile.blockedList) {
    //removal of blocked users from the ID list

    let othersIndex = usersId.indexOf(blocked);

    if (othersIndex !== -1) usersId.splice(othersIndex, 1);
  }

  const otherProfiles = await Profile.find({ user_id: usersId });

  for (const otherProfile of otherProfiles) {
    //removal of users that blocked me

    let imBlockedIndex = otherProfile.blockedList.indexOf(userId);

    if (imBlockedIndex !== -1) {
      let removeIdIndex = usersId.indexOf(otherProfile.user_id.toString());

      if (removeIdIndex !== -1) usersId.splice(removeIdIndex, 1);
    }
  }

  const chats = await Chat.find({
    //finding chats between those IDs and the user's
    $and: [{ members: { $in: usersId } }, { members: userId }],
  })
    .select("members updatedAt emptied")
    .populate({
      path: "members",
      model: User,
      select: "name last_name",
    })
    .populate({
      path: "messages",
      model: Message,
      select: "sender text createdAt -_id",
      options: { perDocumentLimit: 1, sort: { createdAt: -1 } },
    })
    .populate({
      path: "profiles",
      model: Profile,
      select: "profile_photo",
    })
    .sort({ updatedAt: -1 })
    .lean();

  let filteredChats = [];

  //emptied chats are filtered out

  chats.forEach((chat) => {
    const emptied = chat.emptied;

    if (!emptied) {
      //chats that were never emptied are not filtered out
      filteredChats.push(chat);
      return;
    }

    const userIndex = emptied.findIndex((p) => p.userId == userId);

    if (userIndex < 0) {
      //chats never emptied by the user are not filtered out
      filteredChats.push(chat);
      return;
    }

    if (
      //chats that were emptied by the user and then had new messages are not filtered out
      compareAsc(chat.messages[0].createdAt, emptied[userIndex].emptiedAt) == 1
    )
      filteredChats.push(chat);
  });

  // const profilePics = await Profile.find({ user_id: { $in: usersId } }).select(
  //   "profile_photo"
  // );

  return filteredChats;
}

async function emptyChat(token, chatId) {
  const userId = await userService.getUserId(token);

  if (!chatId) throw "Please provide a chat id.";

  const chat = await Chat.findOne({ _id: chatId }),
    emptied = chat.emptied,
    index = emptied.findIndex((i) => i.userId == userId);

  if (!chat) throw "chatId invalid.";

  if (index > -1) {
    emptied[index].emptiedAt = Date.now();
  } else {
    emptied.push({
      userId: userId,
    });
  }

  await chat.save();

  return chat;
}

// Get more messages from chat

// async function getChatMessages(chatId, page) {
//   const chat = await Chat.findOne({
//     _id: chatId,
//   })
//     .select("members messages updatedAt")
//     .populate({ path: "members", model: User, select: "name last_name" })
//     .populate({
//       path: "messages",
//       model: Message,
//       select: "sender text createdAt -_id",
//       options: { limit: 100, sort: { createdAt: -1 } },
//     })
//     .lean();
//   return chat;
// }
