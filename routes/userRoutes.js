const express = require("express");
const {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
} = require("../controllers/authControllers");
const { me } = require("../controllers/userControllers");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

router.get("/me", protect, me);

module.exports = router;
