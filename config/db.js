const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    try {
        const conn = await mongoose.connect(uri);

        console.log(
            `MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`
        );

    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        throw err;
    }
};

module.exports = connectDB;
