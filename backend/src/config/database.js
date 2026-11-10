import mongoose from 'mongoose';
import { env } from './env.js';
export async function connectDatabase() { await mongoose.connect(env.mongoUri); return mongoose.connection; }
export const databaseReady = () => mongoose.connection.readyState === 1;
