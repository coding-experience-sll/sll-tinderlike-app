const express = require("express");
const chatService = require("./chat.service");
const profileService = require("../profiles/profile.service");

const router = express.Router();

// routes
router.post("/new/:id", newChat);
router.put('/emptyChat/:chatId', emptyChat)
router.get('/partialMatch', partialMatch);
router.get('/getChats', getChats)
router.get("/", getAll);
router.get("/:id", getById);

module.exports = router;

//Create Chat

async function newChat(req, res, next) {
  try {
    const sender = req.user.sub;
    const receiver = req.params.id;
    const alreadyExists = await chatService.getChat(sender, receiver);
    if (alreadyExists) return res.json(alreadyExists);
    const newChat = await chatService.newChat(sender, receiver);
    if (newChat) res.json(newChat);
    else res.status(400);
  } catch (err) {
    next(err);
  }
}

async function emptyChat(req, res, next) {

  chatService.emptyChat(req.headers.authorization.split('Bearer ')[1], req.params.chatId)
    .then(chat => chat ? res.json(chat) : res.sendStatus(404).json({message : 'Could not empty the chat.'}))
    .catch((err) => next(err))

}

function partialMatch(req, res, next) {
  chatService.partialMatch(req.query, req.headers.authorization.split(' ')[1])
      .then(chat => chat ? res.json(chat) : res.sendStatus(404))
      .catch(err => next(err));
}

function getChats(req, res, next) {
  chatService.getChats(req.query, req.headers.authorization.split(' ')[1])
      .then(chat => chat ? res.json(chat) : res.sendStatus(404))
      .catch(err => next(err));
}


async function getAll(req, res, next) {
  try {
    const userid = req.user.sub;
    const chats = await chatService.getChats(userid);
    if (chats) res.json(chats);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const userid = req.user.sub;
    const secondUserId = req.params.id;
    const secondUserExists = await profileService.getById(userid);
    if (!secondUserId || !secondUserExists) throw "Invalid id";
    const chat = await chatService.getChat(userid, secondUserId);
    if (chat) res.json(chat);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}
