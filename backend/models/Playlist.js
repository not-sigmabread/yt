const mongoose = require("mongoose");

const PlaylistSchema = new mongoose.Schema({
  name: String,
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
});

module.exports = mongoose.model("Playlist", PlaylistSchema);
