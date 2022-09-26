const express = require("express");
const eventService = require("./event.service");
const multer = require("multer");
const fs = require("fs-extra");

const router = express.Router();

const whitelist = ["image/jpeg", "image/jpg", "image/png"];

let upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      let sub = req.user.sub;
      let path = `./uploads/${sub}`;
      fs.mkdirsSync(path);
      callback(null, path);
    },
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = file.originalname.slice(file.originalname.lastIndexOf("."));
      //originalname is the uploaded file's name with extn
      callback(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!whitelist.includes(file.mimetype)) {
      return cb(new Error("Only jpeg/jpg/png images allowed"));
    }

    cb(null, true);
  },
});

// routes
router.post("/create", upload.single("pf_photo"), newEvent);
router.get("/", getAll);
router.get("/partialMatch", partialMatch);
router.get("/:id", getById);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

module.exports = router;

//Create event

async function newEvent(req, res, next) {
  try {
    if (!req.user.admin) return res.sendStatus(403);
    const event = await eventService.newEvent(req.body, req.user.sub);
    if (event) res.json(event);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const events = await eventService.getEvents(
      req.user.admin,
      req.query.clientid
    );
    if (events) res.json(events);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}

async function partialMatch(req, res, next) {
  try {
    const events = await eventService.partialMatch(req.query.name, req.user.sub);
    if (events) res.json(events);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    if (!req.user.admin) return res.status(403);
    const event = await eventService.getEvent(req.params.id);
    if (event) res.json(event);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    if (!req.user.admin) return res.status(403);
    const event = await eventService.updateEvent(req.params.id, req.body);
    if (event) res.json(event);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    if (!req.user.admin) return res.status(403);
    const result = await eventService.deleteEvent(req.params.id);
    if (result.deletedCount === 1) res.send("Deleted");
    else if (result.deletedCount === 0) res.sendStatus(404);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}
