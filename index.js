const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const userRouter = require("./routes/userRoutes");
const AppError = require("./utils/error");
const errorHandler = require("./middleware/errorHandler");

const app = express();

mongoose
  .connect("mongodb://127.0.0.1:27017/nodeauth", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("> DB connection successful ... ");
  });

app.use(express.json());

app.use("/api/users", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`> App running on port ${PORT} ...`);
});
