const db = require("_helpers/db");
const Client = db.Client;

module.exports = {
  newClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
};

//Create a new client

async function newClient({ name }) {
  const exists = await Client.findOne({ name });
  if (exists) throw "A client with the same name already exists";
  const client = new Client({ name });
  const savedClient = await client.save();
  return savedClient;
}

// Get all clients

async function getClients() {
  const clients = await Client.find()
    .select("name")
    .collation({ locale: "en" })
    .sort({ name: 1 });
  return clients;
}

// Get specific client

async function getClient(clientId) {
  const client = await Client.findOne({
    _id: clientId,
  })
    .select("name events")
    .populate({
      path: "events",
      model: "Event",
      select: "name price location event_description url",
    });

  return client;
}

// update client name
async function updateClient(clientId, { newName }) {
  const client = await Client.findOne({ _id: clientId });
  if (typeof newName !== "string") throw "Invalid name";
  if (!client) throw "Not found";
  const alreadyUsed = await Client.findOne({ name: newName });
  if (alreadyUsed) throw "A client with that name already exists";
  client.name = newName;
  client.save();

  return { name: client.name, _id: client._id };
}

// delete client
async function deleteClient(clientId) {
  const deletedClient = await Client.deleteOne({
    _id: clientId,
  });

  return deletedClient;
}
