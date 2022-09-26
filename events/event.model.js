const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  image: {
    url: { type: String },
    _id: {
      type: mongoose.SchemaTypes.ObjectId,
      //default: mongoose.Types.ObjectId(),
      unique: true,
    },
  },
  name: { type: String, required: true },
  price: { type: Number },
  event_description: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
    address : {type : String}
  },
  url: { type: String, required: true },
  social_url: { type: String, default: "" },
  date: { type: Date, required: true },
  client: { type: mongoose.SchemaTypes.ObjectId, ref: "Client" },
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password;
  },
});

schema.index({location: '2dsphere'});

module.exports = mongoose.model("Event", schema);
