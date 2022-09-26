const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  phone: { type: Number, required: true },
  phone_code: { type: Number, required: true },
  full_phone_number: { type: Number, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  last_name: { type: String, required: true },
  full_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  birthday: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  profileCreated: {type: Boolean, default: false},
  verification_token: { type: String },
  forgot_pw_token: { type: String },
  deviceToken : {type : String}
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password;
  },
});

module.exports = mongoose.model("User", schema);
