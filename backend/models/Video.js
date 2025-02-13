const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  url: String,
  startTime: Number,
  endTime: Number,
});

module.exports = mongoose.model("Video", VideoSchema);
