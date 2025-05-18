const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectmongoDB = async () => {
  try {
    await mongoose.connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB_NAME}`, {
      retryWrites: true, // Enable retryable writes
      w: 'majority' // Majority write concern
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectmongoDB;