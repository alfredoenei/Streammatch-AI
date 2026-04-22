import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const checkUsers = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB not connected');

    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`📊 [DATABASE] Total de usuarios en Atlas: ${userCount}`);

    const users = await usersCollection.find({}, { projection: { email: 1 } }).toArray();
    console.log('👥 [USERS] Lista de emails registrados:');
    users.forEach(u => console.log(`   - ${u.email}`));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();
