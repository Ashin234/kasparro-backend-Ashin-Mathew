const express = require("express");
const controller = require("../controllers/data.controller");

const router = express.Router();

router.get("/", controller.getData);

module.exports = router;
