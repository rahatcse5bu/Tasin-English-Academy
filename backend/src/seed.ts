import 'reflect-metadata';
import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from './users/schemas/user.schema';
import { TeacherSchema } from './teachers/schemas/teacher.schema';
import { BatchSchema } from './batches/schemas/batch.schema';
import { ClassSessionSchema } from './classes/schemas/class.schema';
import { ResourceSchema } from './resources/schemas/resource.schema';
import { ExamSchema, ExamResultSchema } from './exams/schemas/exam.schema';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', UserSchema);
  const Teacher = mongoose.model('Teacher', TeacherSchema);
  const Batch = mongoose.model('Batch', BatchSchema);
  const ClassSession = mongoose.model('ClassSession', ClassSessionSchema);
  const Resource = mongoose.model('Resource', ResourceSchema);
  const Exam = mongoose.model('Exam', ExamSchema);
  const ExamResult = mongoose.model('ExamResult', ExamResultSchema);

  // Wipe (be careful in prod)
  if (process.env.SEED_WIPE === '1') {
    await Promise.all([
      User.deleteMany({}),
      Teacher.deleteMany({}),
      Batch.deleteMany({}),
      ClassSession.deleteMany({}),
      Resource.deleteMany({}),
      Exam.deleteMany({}),
      ExamResult.deleteMany({}),
    ]);
    console.log('Wiped collections');
  }

  // Admin
  const adminEmail = 'admin@tasin.edu.bd';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash('admin1234', 10),
      role: 'admin',
    });
    console.log('Created admin: admin@tasin.edu.bd / admin1234');
  }

  // Teachers
  const teachersData = [
    {
      name: 'Tasin Ahmed',
      nameBn: 'তাসিন আহমেদ',
      designation: 'Founder & Lead English Instructor',
      designationBn: 'প্রতিষ্ঠাতা ও প্রধান ইংরেজি শিক্ষক',
      bio: 'HSC English specialist with 6+ years of teaching experience.',
      bioBn: 'এইচএসসি ইংরেজি বিশেষজ্ঞ, ৬+ বছরের শিক্ষকতার অভিজ্ঞতা।',
      subjects: ['HSC English 1st', 'HSC English 2nd', 'SSC English 1st', 'SSC English 2nd'],
      qualification: 'BA (Hons), MA in English',
      qualificationBn: 'বিএ (অনার্স), এমএ ইংরেজি',
      experienceYears: 6,
      displayOrder: 1,
    },
    {
      name: 'Rakib Hasan',
      nameBn: 'রাকিব হাসান',
      designation: 'ICT Instructor',
      designationBn: 'আইসিটি শিক্ষক',
      bio: 'CSE graduate, passionate about making ICT easy for HSC students.',
      bioBn: 'সিএসই গ্র্যাজুয়েট, এইচএসসি শিক্ষার্থীদের জন্য আইসিটি সহজ করতে আগ্রহী।',
      subjects: ['ICT'],
      qualification: 'BSc in CSE',
      qualificationBn: 'বিএসসি সিএসই',
      experienceYears: 4,
      displayOrder: 2,
    },
    {
      name: 'Sadia Islam',
      nameBn: 'সাদিয়া ইসলাম',
      designation: 'SSC English Instructor',
      designationBn: 'এসএসসি ইংরেজি শিক্ষক',
      bio: 'Specializes in grammar foundations and writing skills for SSC.',
      bioBn: 'এসএসসি গ্রামার ভিত্তি ও রাইটিং দক্ষতায় বিশেষজ্ঞ।',
      subjects: ['SSC English 1st', 'SSC English 2nd'],
      qualification: 'MA in English',
      qualificationBn: 'এমএ ইংরেজি',
      experienceYears: 3,
      displayOrder: 3,
    },
  ];
  const teachers = [];
  for (const t of teachersData) {
    let teacher = await Teacher.findOne({ name: t.name });
    if (!teacher) teacher = await Teacher.create(t);
    teachers.push(teacher);
  }
  console.log(`Teachers: ${teachers.length}`);

  // Batches
  const batchesData: any[] = [
    {
      name: 'HSC-26 English Premium A',
      nameBn: 'এইচএসসি-২৬ ইংরেজি প্রিমিয়াম এ',
      code: 'HSC26-ENG-P-A',
      type: 'premium',
      subject: 'HSC_ENGLISH_1ST',
      description: 'Premium small-group HSC English 1st paper batch (max 10 students).',
      descriptionBn: 'প্রিমিয়াম স্মল-গ্রুপ এইচএসসি ইংরেজি ১ম পত্র ব্যাচ (সর্বোচ্চ ১০ জন)।',
      teachers: [teachers[0]._id],
      monthlyFee: 500,
      maxStudents: 10,
      schedule: [
        { day: 'Sat', startTime: '20:00', endTime: '21:30' },
        { day: 'Tue', startTime: '20:00', endTime: '21:30' },
      ],
      gmeetLink: 'https://meet.google.com/abc-defg-hij',
      freeClassCount: 3,
      startDate: new Date('2026-05-04'),
    },
    {
      name: 'HSC-26 English General',
      nameBn: 'এইচএসসি-২৬ ইংরেজি জেনারেল',
      code: 'HSC26-ENG-G',
      type: 'general',
      subject: 'HSC_ENGLISH_1ST',
      description: 'General HSC English batch with affordable fee for all students.',
      descriptionBn: 'সকল শিক্ষার্থীর জন্য সাশ্রয়ী ফি-তে জেনারেল এইচএসসি ইংরেজি ব্যাচ।',
      teachers: [teachers[0]._id],
      monthlyFee: 350,
      maxStudents: 30,
      schedule: [
        { day: 'Sun', startTime: '19:30', endTime: '21:00' },
        { day: 'Wed', startTime: '19:30', endTime: '21:00' },
      ],
      gmeetLink: 'https://meet.google.com/xyz-pqrs-tuv',
      freeClassCount: 3,
      startDate: new Date('2026-05-05'),
    },
    {
      name: 'SSC-26 English General',
      nameBn: 'এসএসসি-২৬ ইংরেজি জেনারেল',
      code: 'SSC26-ENG-G',
      type: 'general',
      subject: 'SSC_ENGLISH_1ST',
      description: 'SSC English 1st & 2nd paper batch with grammar foundations.',
      descriptionBn: 'গ্রামার ভিত্তি সহ এসএসসি ইংরেজি ১ম ও ২য় পত্র ব্যাচ।',
      teachers: [teachers[2]._id],
      monthlyFee: 350,
      maxStudents: 30,
      schedule: [
        { day: 'Mon', startTime: '18:00', endTime: '19:30' },
        { day: 'Thu', startTime: '18:00', endTime: '19:30' },
      ],
      gmeetLink: 'https://meet.google.com/ssc-eng-batch',
      freeClassCount: 3,
      startDate: new Date('2026-05-06'),
    },
    {
      name: 'HSC-26 ICT General',
      nameBn: 'এইচএসসি-২৬ আইসিটি জেনারেল',
      code: 'HSC26-ICT-G',
      type: 'general',
      subject: 'ICT',
      description: 'HSC ICT batch — full syllabus coverage with practice problems.',
      descriptionBn: 'এইচএসসি আইসিটি ব্যাচ — সম্পূর্ণ সিলেবাস ও অনুশীলনী।',
      teachers: [teachers[1]._id],
      monthlyFee: 400,
      maxStudents: 30,
      schedule: [
        { day: 'Fri', startTime: '20:00', endTime: '21:30' },
      ],
      gmeetLink: 'https://meet.google.com/hsc-ict-batch',
      freeClassCount: 3,
      startDate: new Date('2026-05-08'),
    },
  ];
  const batches = [];
  for (const b of batchesData) {
    let batch = await Batch.findOne({ code: b.code });
    if (!batch) batch = await Batch.create(b);
    batches.push(batch);
  }
  console.log(`Batches: ${batches.length}`);

  // Sample students
  const studentsData = [
    { name: 'Mehedi Hasan', email: 'mehedi@student.local', level: 'HSC', institution: 'Notre Dame College' },
    { name: 'Tahmid Khan', email: 'tahmid@student.local', level: 'HSC', institution: 'Dhaka College' },
    { name: 'Nusrat Jahan', email: 'nusrat@student.local', level: 'HSC', institution: 'Holy Cross' },
    { name: 'Arif Rahman', email: 'arif@student.local', level: 'SSC', institution: 'Govt. Laboratory High School' },
    { name: 'Sumaiya Akter', email: 'sumaiya@student.local', level: 'SSC', institution: 'Viqarunnisa Noon' },
  ];
  const students = [];
  for (const s of studentsData) {
    let user = await User.findOne({ email: s.email });
    if (!user) {
      user = await User.create({
        ...s,
        passwordHash: await bcrypt.hash('student1234', 10),
        role: 'student',
        enrolledBatches: s.level === 'HSC' ? [batches[0]._id] : [batches[2]._id],
      });
    }
    students.push(user);
  }
  console.log(`Students: ${students.length}`);

  // Class sessions for next 14 days
  for (const b of batches) {
    const existing = await ClassSession.countDocuments({ batch: b._id });
    if (existing > 0) continue;
    const start = new Date();
    start.setHours(20, 0, 0, 0);
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i * 2);
      await ClassSession.create({
        batch: b._id,
        title: `Class ${i + 1}: Introduction & Basics`,
        titleBn: `ক্লাস ${i + 1}: পরিচিতি ও মৌলিক ধারণা`,
        topic: 'Foundations',
        topicBn: 'মৌলিক ভিত্তি',
        scheduledAt: d,
        durationMinutes: 90,
        teacher: b.teachers?.[0],
        gmeetLink: b.gmeetLink,
        status: 'scheduled',
      });
    }
  }
  console.log('Created class sessions');

  // Resources
  const resourcesData: any[] = [
    {
      title: 'HSC English Grammar Hacks',
      titleBn: 'এইচএসসি ইংরেজি গ্রামার হ্যাকস',
      kind: 'hack',
      level: 'HSC',
      subject: 'English',
      bodyBn: 'প্রতিদিন ১০টি common phrasal verbs শিখুন। পরীক্ষায় ১০ নম্বরের বেশি সহজ হবে।',
      isPublic: true,
      tags: ['grammar', 'hsc', 'english'],
    },
    {
      title: 'SSC English Suggestion 2026',
      titleBn: 'এসএসসি ইংরেজি সাজেশন ২০২৬',
      kind: 'suggestion',
      level: 'SSC',
      subject: 'English',
      bodyBn: 'এই বছরের জন্য গুরুত্বপূর্ণ ৫টি প্যারাগ্রাফ ও ৫টি অ্যাপ্লিকেশনের তালিকা।',
      isPublic: true,
      tags: ['ssc', 'suggestion'],
    },
    {
      title: 'HSC Pre-Exam Best Practices',
      titleBn: 'এইচএসসি পূর্ব-পরীক্ষা সেরা অনুশীলন',
      kind: 'best_practice',
      level: 'HSC',
      bodyBn: 'প্রতিদিন ১ ঘন্টা রিভিশন, সপ্তাহে ১টি মডেল টেস্ট। ঘুম ও পুষ্টিকর খাবার বজায় রাখুন।',
      isPublic: true,
      tags: ['routine', 'tips'],
    },
  ];
  for (const r of resourcesData) {
    const exists = await Resource.findOne({ title: r.title });
    if (!exists) await Resource.create(r);
  }

  // Exam + results to seed top performers
  for (const b of batches.slice(0, 3)) {
    const examTitle = `Weekly Test 1 - ${b.code}`;
    let exam = await Exam.findOne({ title: examTitle });
    if (!exam) {
      exam = await Exam.create({
        batch: b._id,
        title: examTitle,
        titleBn: `সাপ্তাহিক টেস্ট ১ - ${b.code}`,
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        totalMarks: 100,
        status: 'evaluated',
      });

      const enrolled = students.filter((s) =>
        s.enrolledBatches.map(String).includes(String(b._id)),
      );
      let i = 0;
      for (const st of enrolled.length ? enrolled : students.slice(0, 3)) {
        const marks = Math.floor(95 - i * 7 - Math.random() * 5);
        await ExamResult.create({
          exam: exam._id,
          student: st._id,
          batch: b._id,
          marks,
          totalMarks: 100,
        });
        i++;
      }
      // recompute ranks
      const results = await ExamResult.find({ exam: exam._id }).sort({ marks: -1 });
      let rank = 0;
      let prev = -1;
      let counter = 0;
      for (const r of results) {
        counter++;
        if (r.marks !== prev) rank = counter;
        prev = r.marks;
        r.rank = rank;
        await r.save();
      }
    }
  }
  console.log('Seeded exams + results');

  console.log('\nSeed complete. Login: admin@tasin.edu.bd / admin1234');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
