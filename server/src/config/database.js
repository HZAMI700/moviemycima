const mongoose = require('mongoose');

let memoryServer;

async function connectDatabase() {
  if (process.env.NODE_ENV === 'test' || process.env.MONGODB_URI === 'memory') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to in-memory MongoDB');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moviemycima');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.warn('MongoDB connection failed, using in-memory fallback...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to in-memory MongoDB (fallback)');
  }
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDatabase, disconnectDatabase };
