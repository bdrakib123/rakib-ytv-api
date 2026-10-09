const express = require("express");
const router = express.Router();
const yt = require("../controllers/ytController");

router.get("/search", yt.searchVideo);
router.get("/info", yt.getInfo);

module.exports = router;
