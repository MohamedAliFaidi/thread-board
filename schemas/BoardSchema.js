const Schema = require("mongoose").Schema;

const BoardSchema = new Schema(
  {
    text: { type: String, required: true },
    created_on: { type: Date, required: true, default: Date.now() },
    bumped_on: { type: Date, required: true, default: Date.now() },
    reported: { type: Boolean, required: true, default: false },
    delete_password: { type: String, required: true },
    replies: [
      {
        text: { type: String },
        reported: { type: Boolean, default: false },
        delete_password: { type: String },
        created_on: { type: Date, default: Date.now() }
      }
    ]
  },
  { versionKey: false }
);

module.exports = BoardSchema;
