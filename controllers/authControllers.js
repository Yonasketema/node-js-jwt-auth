const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: process.env.EXPIRE_IN,
  });
};

exports.signup = asyncHandler(async (req, res, next) => {
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
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new Error("please provide email and password!"));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new Error("Incorrect email or password"));
  }

  const token = signToken(user.id);

  res.status(201).json({
    token,
  });
});

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(new Error("Authentication credentials were not provided."));
  }
  let decoded;

  jwt.verify(token, process.env.SECRET_KEY, (err, dec) => {
    decoded = { ...dec };
    if (err) {
      return next(err);
    }
  });

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new Error("The user does not exist"));
  }

  if (user.isPasswordchanged(decoded.iat)) {
    return next(new Error("User changed password! please login again"));
  }

  req.user = user;

  next();
});

exports.permissionTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new Error("You are not allowed to access this"));
    }
    next();
  };
};
