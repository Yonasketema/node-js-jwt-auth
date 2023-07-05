const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./routes/userRoutes");
require("dotenv").config({ path: ".env" });

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

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`> App running on port ${PORT} ...`);
});
