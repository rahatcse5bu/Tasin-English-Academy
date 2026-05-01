import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';

@Injectable()
export class AttendanceService {
  constructor(@InjectModel(Attendance.name) private model: Model<AttendanceDocument>) {}

  byClass(classSessionId: string) {
    return this.model.find({ classSession: classSessionId }).populate('student', 'name email').exec();
  }

  byStudent(studentId: string, batchId?: string) {
    const filter: any = { student: studentId };
    if (batchId) filter.batch = batchId;
    return this.model.find(filter).populate('classSession', 'title scheduledAt').sort({ createdAt: -1 }).exec();
  }

  byBatch(batchId: string) {
    return this.model
      .find({ batch: batchId })
      .populate('student', 'name email')
      .populate('classSession', 'title scheduledAt')
      .sort({ createdAt: -1 })
      .exec();
  }

  async upsertMany(records: { classSession: string; batch: string; student: string; status: string; markedBy?: string; remark?: string }[]) {
    const ops = records.map((r) => ({
      updateOne: {
        filter: { classSession: r.classSession, student: r.student },
        update: { $set: r },
        upsert: true,
      },
    }));
    if (ops.length === 0) return { ok: true, count: 0 };
    const res = await this.model.bulkWrite(ops as any);
    return { ok: true, upserted: res.upsertedCount, modified: res.modifiedCount };
  }

  async stats(studentId: string, batchId?: string) {
    const match: any = { student: new (this.model.base.Types.ObjectId as any)(studentId) };
    if (batchId) match.batch = new (this.model.base.Types.ObjectId as any)(batchId);
    const r = await this.model.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return r.reduce((acc: any, x: any) => ({ ...acc, [x._id]: x.count }), {});
  }
}
