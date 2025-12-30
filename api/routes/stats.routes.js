const express = require("express");
const router = express.Router();
const controller = require("../controllers/stats.controller");
const auth = require("../middleware/auth");

router.get("/", auth, controller.getStats);

module.exports = router;
