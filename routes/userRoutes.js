const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const { verifyAccessToken } = require("../Helpers/jwt_helper");


router.post("/", controller.create);

router.get( "/", verifyAccessToken, controller.getAllUsers);

router.post("/login", controller.login);

router.get("/profile", verifyAccessToken, controller.getProfile);

router.put("/update-password", verifyAccessToken, controller.updatePassword);

router.patch("/users/:userId/status",verifyAccessToken,controller.updateUserStatus);

module.exports = router;
