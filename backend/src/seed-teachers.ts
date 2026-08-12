import 'reflect-metadata';
import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from './users/schemas/user.schema';
import { TeacherSchema } from './teachers/schemas/teacher.schema';

/**
 * Creates LOGIN ACCOUNTS for teachers.
 *
 * Note the distinction:
 *   `teachers` collection = public profiles shown on the শিক্ষকবৃন্দ page (no password)
 *   `users`    collection = accounts that can log in (role: admin | teacher | student)
 *
 * Slide classes (/decks) are staff-only, so every mentor needs a `users` row
 * with role `teacher`. This script makes one account per active teacher profile
 * that has an email, plus any extras listed in EXTRA_TEACHERS below.
 *
 *   npm run seed:teachers                       # create/update accounts
 *   TEACHER_PASSWORD=SomeStrongPass npm run seed:teachers
 *
 * Existing accounts are never silently re-passworded — pass RESET_PASSWORD=1
 * if you deliberately want to reset them.
 */

const DEFAULT_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher1234';
const RESET = process.env.RESET_PASSWORD === '1';

/** Mentors who need an account but have no teacher profile yet. */
const EXTRA_TEACHERS: { name: string; email: string }[] = [
  { name: 'Tasin Ahmed', email: 'tasin@tasin.edu.bd' },
  { name: 'Sadia Islam', email: 'sadia@tasin.edu.bd' },
  { name: 'Md Rahat', email: 'rahat@tasin.edu.bd' },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', UserSchema);
  const Teacher = mongoose.model('Teacher', TeacherSchema);

  const profiles = await Teacher.find({ active: true }).lean();
  const wanted = [
    ...profiles
      .filter((t: any) => t.email)
      .map((t: any) => ({ name: t.name as string, email: String(t.email).toLowerCase() })),
    ...EXTRA_TEACHERS.map((t) => ({ ...t, email: t.email.toLowerCase() })),
  ];

  if (!wanted.length) {
    console.log('No teacher emails found. Add an email to a teacher profile, or edit EXTRA_TEACHERS.');
    await mongoose.disconnect();
    return;
  }

  const created: string[] = [];
  const promoted: string[] = [];
  const reset: string[] = [];
  const untouched: string[] = [];

  for (const t of wanted) {
    const existing: any = await User.findOne({ email: t.email });

    if (!existing) {
      await User.create({
        name: t.name,
        email: t.email,
        passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 10),
        role: 'teacher',
        active: true,
      });
      created.push(t.email);
      continue;
    }

    if (existing.role !== 'teacher' && existing.role !== 'admin') {
      existing.role = 'teacher';
      await existing.save();
      promoted.push(t.email);
    } else if (RESET) {
      existing.passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await existing.save();
      reset.push(t.email);
    } else {
      untouched.push(t.email);
    }
  }

  const show = (label: string, list: string[]) =>
    list.length && console.log(`${label}: ${list.join(', ')}`);

  show('Created', created);
  show('Promoted to teacher', promoted);
  show('Password reset', reset);
  show('Already existed (unchanged)', untouched);

  if (created.length || reset.length) {
    console.log(`\nPassword for the accounts above: ${DEFAULT_PASSWORD}`);
    console.log('⚠  Change it after the first login — anyone with it can open every slide class.');
  }

  const total = await User.countDocuments({ role: 'teacher' });
  console.log(`\nTeacher accounts in the database: ${total}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
