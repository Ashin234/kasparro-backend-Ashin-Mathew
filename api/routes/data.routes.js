const express = require("express");
const controller = require("../controllers/data.controller");
const router = express.Router();
const auth = require("../middlewares/auth");

router.get("/", auth, controller.getData);

module.exports = router;
