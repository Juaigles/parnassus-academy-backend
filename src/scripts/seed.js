import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

async function run(){
  await connectDB();
  const adminEmail = 'admin@demo.com';
  const teacherEmail = 'teacher@demo.com';
  const pass = await bcrypt.hash('Password123', 10);

  const upsert = async (email, roles)=> {
    let u = await User.findOne({ email });
    if (!u) u = await User.create({ email, passwordHash: pass, roles, emailVerified: true });
    console.log('✔ user', email, roles);
  };
  await upsert(adminEmail, ['admin']);
  await upsert(teacherEmail, ['teacher']);
  process.exit(0);
}
run().catch(e=>{ console.error(e); process.exit(1); });
