const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elearning_db';
  
  if (uri.includes('<db_password>')) {
    console.warn('⚠️ WARNING: <db_password> placeholder detected in MONGODB_URI.');
    console.warn('👉 Please replace "<db_password>" in your .env file with your actual MongoDB Atlas database password.');
  }

  try {
    const isCloud = uri.startsWith('mongodb+srv://');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: isCloud ? 10000 : 3000
    });
    console.log(`✅ MongoDB Connected to: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.warn(`⚠️ Could not connect to primary MongoDB (${err.message}). Starting embedded MongoMemoryServer...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      
      await mongoose.connect(memoryUri);
      console.log(`✅ Embedded MongoMemoryServer connected successfully at ${memoryUri}`);
    } catch (memErr) {
      console.error(`❌ Failed to start database:`, memErr.message);
      throw memErr;
    }
  }
};

module.exports = connectDB;

