const express = require("express");
const Playlist = require("../models/Playlist");

const router = express.Router();

router.post("/create", async (req, res) => {
  const { name, videos } = req.body;
  const playlist = new Playlist({ name, videos });
  await playlist.save();
  res.json(playlist);
});

router.get("/:id", async (req, res) => {
  const playlist = await Playlist.findById(req.params.id).populate("videos");
  res.json(playlist);
});

module.exports = router;
