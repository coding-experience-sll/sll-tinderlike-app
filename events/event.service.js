const db = require("_helpers/db");
const Event = db.Event;
const Client = db.Client;
const Profile = db.Profile;
const User = db.User;
const fs = require("fs-extra");
const path = require("path");
const mongoose = require("mongoose");
const { uploadFile } = require("./../s3");
const crypto = require("crypto");
const startOfDay = require('date-fns/startOfDay');
const addWeeks = require('date-fns/addWeeks');
const { profileEnd } = require("console");
const push = require('../_helpers/push');

module.exports = {
  uploadFiles,
  newEvent,
  getEvents,
  partialMatch,
  getEvent,
  updateEvent,
  deleteEvent,
};

//upload event pictures

async function uploadFiles(id) {

  const uploadFolderPath = path.join(path.resolve(), `/uploads/${id}`);

  const image_name = await fs.readdir(uploadFolderPath);

  const uploadedPhoto = await uploadFile(
    `${uploadFolderPath}/${image_name[image_name.length - 1]}`
  );

  const url = {
    url: uploadedPhoto,
    _id: mongoose.Types.ObjectId(crypto.randomBytes(12).toString("hex"))
  }

  await fs.unlink(`${uploadFolderPath}/${image_name[0]}`);

  return url;
}

//Create a new event

async function newEvent(params, id) {

  //events must be linked to a client registered in the database

  const foundClient = await Client.findOne({ _id: params.client });

  if (!foundClient) throw "Client not found";

  const image = await uploadFiles(id);  //AWS upload file function

  const coordinates = [params.longitude, params.latitude];//storing coordinates for later use

  const event = new Event({
    name: params.name,
    price: params.price,
    event_description: params.event_description,
    url: params.url,
    social_url: params.social_url,
    date: params.date,
    client: params.client,
    image: image
  });

  event.location.coordinates = coordinates;
  event.location.address = params.address;

  const savedEvent = await event.save();

  foundClient.events = [...foundClient.events, savedEvent.id];
  await foundClient.save();


  //We look for the users' profiles in order to notify them (20km range)
  //we need to first look for the profiles because the location is stored there.
  //then for the users because the push token is stored there. Should optimize
  const profiles = await Profile.find({
    location: {
      $near: {
        $maxDistance: 20000,
        $geometry: {
          type: "Point",
          coordinates: coordinates,
          index: "2dsphere"
        }
      }
    }
  });

  let usersId = [];

  if (profiles) usersId = profiles.map((profile) => profile.user_id);
  
  const users = await User.find({ _id: { $in: usersId } })

  let pushTokens = [];

  if (users) pushTokens = users.map((user) => user.deviceToken);

  const somePushTokens = pushTokens.filter(token => typeof(token) !== 'undefined');

  await push.sendBulk(somePushTokens, savedEvent);

  return savedEvent;

}

// Get all events

async function getEvents(admin, clientId) {
  if (admin) {
    if (clientId) {
      const events = await Event.find({ client: clientId })
        .select(
          "name price event_description location url client social_url date"
        )
        .populate({ path: "client", model: "Client", select: "name" })
        .sort({ createdAt: 1 });
      return events;
    } else {
      const events = await Event.find()
        .select(
          "name price event_description location url client social_url date"
        )
        .populate({ path: "client", model: "Client", select: "name" })
        .sort({ createdAt: 1 });
      return events;
    }
  } else {
    const events = await Event.find()
      .select("name price event_description location social_url date image")
      .sort({ createdAt: 1 });
    return events;
  }
}

async function partialMatch(name, id) {

  const user = await Profile.findOne({ user_id: id });

  if (!user) throw 'user not found';

  const coordinates = user.location.coordinates;

  const week = addWeeks(startOfDay(new Date()), 1);

  if (name) {
    const events = await Event.find({
      $and: [
        { name: { "$regex": name, "$options": "i" } },
        {
          location: {
            $near: {
              $maxDistance: 13600,
              $geometry: {
                type: "Point",
                coordinates: coordinates,
                index: "2dsphere"
              }
            }
          }
        },
        {
          $and: [
            { date: { $gte: startOfDay(new Date()) } },
            { date: { $lte: week } }
          ]
        }
      ]
    })
      .select(
        "name price event_description location url client social_url date image"
      )
      .populate({ path: "client", model: "Client", select: "name" })
      .sort({ createdAt: 1 });
    return events;
  } else {
    const events = await Event.find({
      $and: [
        {
          location: {
            $near: {
              $maxDistance: 20000,
              $geometry: {
                type: "Point",
                coordinates: coordinates,
                index: "2dsphere"
              }
            }
          }
        },
        {
          $and: [
            { date: { $gte: startOfDay(new Date()) } },
            { date: { $lte: week } }
          ]
        }
      ]
    })
      .select(
        "name price event_description location url client social_url date image"
      )
      .populate({ path: "client", model: "Client", select: "name" })
      .sort({ createdAt: 1 });
    return events;
  }
}

// Get specific event only admin

async function getEvent(eventId) {
  const event = await Event.findOne({ _id: eventId })
    .select("name price event_description location url client social_url date")
    .populate({ path: "client", model: "Client", select: "name" });
  return event;
}

// update event
async function updateEvent(eventId, params) {
  const event = await Event.findOne({ _id: eventId });

  if (!event) throw "Not found";

  event.name = params.name ? params.name : event.name;
  event.price = params.price ? params.price : event.price;
  event.event_description = params.event_description
    ? params.event_description
    : event.event_description;
  event.location = params.location ? params.location : event.location;
  event.url = params.url ? params.url : event.url;
  event.date = params.date ? params.date : event.date;
  event.social_url = params.social_url ? params.social_url : event.social_url;
  event.save();

  return event;
}

// delete event
async function deleteEvent(eventId) {
  const deletedEvent = await Event.deleteOne({
    _id: eventId,
  });
  const clientWithEvent = await Client.findOne({ events: eventId });
  if (clientWithEvent) {
    const updatedEventList = clientWithEvent.events.filter(
      (id) => id.toString() != eventId
    );
    clientWithEvent.events = updatedEventList;
    await clientWithEvent.save();
  }
  return deletedEvent;
}
