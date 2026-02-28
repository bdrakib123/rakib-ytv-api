const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const yt = require("../controllers/ytController");

// 🔎 Search Videos
router.get("/search", auth, yt.searchVideo);

// 📄 Get Video Info
router.get("/info", auth, yt.getInfo);

// ⬇️ Download Video (stream)
router.get("/download", auth, yt.downloadVideo);

module.exports = router;
