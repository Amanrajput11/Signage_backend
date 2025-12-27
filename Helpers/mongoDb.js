const mongoose = require("mongoose");
const debug = require("debug")(process.env.DEBUG + "mongodb");

mongoose.set("strictQuery", true);

mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME,
  })
  .then(() => {
    debug("MongoDB connected.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

console.log("Connecting to MongoDB URI:", process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  debug(`Mongoose connected to DB: ${process.env.DB_NAME}`);
});

mongoose.connection.on("error", (err) => {
  debug("Mongoose error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  debug("Mongoose disconnected.");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  debug("Mongoose connection closed due to app termination.");
  process.exit(0);
});
