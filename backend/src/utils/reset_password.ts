import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import bcrypt from 'bcryptjs';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resetPassword = async (email: string, newPassword: string) => {
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
    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.log(`❌ [ERROR] Usuario ${email} no encontrado.`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashed } }
    );

    console.log(`✅ [SUCCESS] Contraseña de ${email} reseteada a: ${newPassword}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetPassword('andresenei@gmail.com', 'streammatch2026');
