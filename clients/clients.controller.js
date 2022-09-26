const express = require("express");
const clientService = require("./client.service");

const router = express.Router();

// routes
router.post("/create", newClient);
router.get("/", getAll);
router.get("/:id", getById);
router.put("/:id", updateClientName);
router.delete("/:id", deleteClient);

module.exports = router;

//Create client

async function newClient(req, res, next) {
  try {
    if (!req.user.admin) return res.sendStatus(403);
    if (!req.body.name || req.body.name.length < 3 || req.body.name.length > 50)
      throw "Name should be between 3 and 50 characters long";
    const client = await clientService.newClient(req.body);
    if (client) res.json(client);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    if (!req.user.admin) return res.status(403);
    const clients = await clientService.getClients();
    if (clients) res.json(clients);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    if (!req.user.admin) return res.status(403);
    const client = await clientService.getClient(req.params.id);
    if (client) res.json(client);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}

async function updateClientName(req, res, next) {
  try {
    if (!req.user.admin) return res.status(403);
    const client = await clientService.updateClient(req.params.id, req.body);
    if (client) res.json(client);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}

async function deleteClient(req, res, next) {
  try {
    if (!req.user.admin) return res.status(403);
    const result = await clientService.deleteClient(req.params.id);
    if (result.deletedCount === 1) res.send("Deleted");
    else if (result.deletedCount === 0) res.sendStatus(404);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}
