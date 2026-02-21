
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const connectDB = async () => {
    try {
        console.log("connectDB function called");
        const mongoURI = process.env.MONGO_URI;
        console.log("Detailed MONGO_URI Check:", mongoURI ? "Defined" : "Undefined");

        if (!mongoURI) {
            console.error('MONGO_URI is not defined in .env file');
            process.exit(1);
        }

        console.log("Attempting to connect to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected...');
    } catch (err: any) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

export default connectDB;
