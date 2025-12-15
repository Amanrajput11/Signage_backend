const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const { verifyAccessToken } = require("../Helpers/jwt_helper");


router.post("/", controller.create);

router.post("/login", controller.login);

router.get("/profile", verifyAccessToken, controller.getProfile);

router.put("/update-password", verifyAccessToken, controller.updatePassword);

module.exports = router;
