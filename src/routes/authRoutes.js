const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/:token", authController.authenticateUser);
router.get("/:token", authController.checkAuthentication);

module.exports = router;
