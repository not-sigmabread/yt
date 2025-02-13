const express = require("express");
const Video = require("../models/Video");

const router = express.Router();

router.post("/create", async (req, res) => {
  const { url, startTime, endTime } = req.body;
  const video = new Video({ url, startTime, endTime });
  await video.save();
  res.json(video);
});

router.get("/:id", async (req, res) => {
  const video = await Video.findById(req.params.id);
  res.json(video);
});

module.exports = router;
