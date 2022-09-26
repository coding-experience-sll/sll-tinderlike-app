const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const emptiedSchema = new mongoose.Schema(
  {
    userId: { type: String },
    emptiedAt: { type: Date, default: Date.now }
  }, {_id : false}
)

const ChatSchema = new mongoose.Schema(
  {
    members: {
      type: Array,
    },
    profiles: {
      type: Array,
    },
    messages: { type: Array },
    emptied: [emptiedSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
