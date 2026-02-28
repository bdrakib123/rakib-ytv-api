const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const yt = require("../controllers/ytController");

router.get("/info", auth, yt.getInfo);
router.get("/download", auth, yt.downloadVideo);
router.get("/audio", auth, yt.downloadAudio);

module.exports = router;
