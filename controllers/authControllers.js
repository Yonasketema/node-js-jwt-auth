const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: process.env.EXPIRE_IN,
  });
};

exports.signup = async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  const token = signToken(newUser.id);

  newUser.password = undefined;

  res.status(201).json({ token, user: newUser });
};
