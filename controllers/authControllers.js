const User = require("../models/userModel");

exports.signup = async (req, res, next) => {
  const newUser = await User.create(req.body);

  newUser.password = undefined;

  res.status(201).json(newUser);
};
