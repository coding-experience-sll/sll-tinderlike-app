const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  user_id: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  images: [
    {
      url: { type: String },
      _id: {
        type: mongoose.SchemaTypes.ObjectId,
        //default: mongoose.Types.ObjectId(),
        unique: true,
      },
    },
  ],
  profile_photo: {
    url: { type: String },
    _id: {
      type: mongoose.SchemaTypes.ObjectId,
      unique: true,
    },
  },
  name: { type: String, required: true },
  last_name: { type: String, required: true },
  interests: [{ type: String }],
  birthday: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female"], required: true },
  looking_for: {
    type: String,
    enum: ["Male", "Female", "Both"],
    default: null,
  },
  age_from: { type: Number, min: 18, max: 100 },
  age_to: { type: Number, min: 18, max: 100 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    }
  },
  blockedList : {type : [String]}
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password;
  },
});

schema.virtual("age").get(function () {
  const now = new Date();
  const current_year = now.getFullYear();
  const year_diff = current_year - this.birthday.getFullYear();
  const birthday_this_year = new Date(
    current_year,
    this.birthday.getMonth(),
    this.birthday.getDate()
  );
  const has_had_birthday_this_year = now >= birthday_this_year;

  return has_had_birthday_this_year ? year_diff : year_diff - 1;
});

schema.index({location: '2dsphere'});

module.exports = mongoose.model("Profile", schema);
