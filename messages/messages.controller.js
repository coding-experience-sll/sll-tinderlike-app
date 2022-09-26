const express = require("express");
const messageService = require("./message.service");

const router = express.Router();

// routes
router.post("/new/:chatid", newMessage);
router.get("/:chatid", getMessages);

module.exports = router;

//Create Profile

async function newMessage(req, res, next) {
  try {
    const chatId = req.params.chatid;
    const sender = req.user.sub;
    const text = req.body.text;
    if (text.length >= 300 || text.length === 0)
      throw "Text shouldn't be empty and be less or equal than 300 characters";
    const message = await messageService.newMessage(chatId, sender, text);

    if (message) return res.json(message);
    else res.status(400);
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const chatId = req.params.chatid;
    const messages = await messageService.getMessages(chatId);
    if (messages) res.json(messages);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}
