const mongoose = require('mongoose')
const debug = require('debug')(process.env.DEBUG+'mongodb');

mongoose.set('strictQuery', true);

const fs = require('fs');

mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
      useUnifiedTopology: true,

  })
  .then(() => {
    debug('mongodb connected.')
  })
  .catch((err) => console.log(err.message))
console.log("Connecting to MongoDB URI:", process.env.MONGODB_URI); // or MONGO_URI

mongoose.connection.on('connected', () => {
    debug(`Mongoose connecting to ${process.env.DB_NAME}`)
})

mongoose.connection.on('error', (err) => {
    debug(err.message)
})

mongoose.connection.on('disconnected', () => {
    debug('Mongoose connection is disconnected.')
})

process.on('SIGINT', async () => {
  await mongoose.connection.close()
  process.exit(0)
})