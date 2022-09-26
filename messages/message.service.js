const db = require("_helpers/db");
const Message = db.Message;

module.exports = {
  newMessage,
  getMessages,
};

// Create a new message

async function newMessage(chatId, sender, text) {
  const message = new Message({ chatId, sender, text });
  const savedMessage = await message.save();
  return savedMessage;
}

// Get all chat messages

async function getMessages(chatId, page) {
  if (page === undefined) page = 0;
  const allMessages = await Message.find({ chatId })
    .select("sender text createdAt")
    .skip(100 * page)
    .sort({ createdAt: -1 })
    .lean();
  return allMessages;
}
