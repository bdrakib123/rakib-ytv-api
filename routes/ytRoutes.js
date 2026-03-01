const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const yt = require("../controllers/ytController");

// 🔎 Search
router.get("/search", auth, yt.searchVideo);

// 📄 Basic Info
router.get("/info", auth, yt.getBasicInfo);

// 🎥 Formats (CDN Links)
router.get("/formats", auth, yt.getFormats);

module.exports = router;
