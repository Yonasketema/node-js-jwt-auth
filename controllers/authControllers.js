const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const sendEmail = require("../utils/email");

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

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new Error("There is no user with this email address."));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `password forgot enter new password and PasswordConfirm to :${resetURL}.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token(valid for 10min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new Error("there was an error sending email"));
  }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new Error("Token is invalid"));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const token = signToken(user.id);

  res.status(200).json({
    token,
  });
});

exports.changePassword = async (req, res, next) => {
  const { oldPassword, password, passwordConfirm } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.isPasswordCorrect(oldPassword, user.password))) {
    return next(new Error("Your password is wrong."));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();

  const token = signToken(user.id);

  res.status(200).json({
    token,
  });
};
