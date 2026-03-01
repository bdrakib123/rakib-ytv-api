const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const yt = require("../controllers/ytController");

router.get("/search", auth, yt.searchVideo);
router.get("/info", auth, yt.getInfo);

module.exports = router;
