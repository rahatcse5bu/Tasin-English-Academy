import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument, ExamResult, ExamResultDocument } from './schemas/exam.schema';

@Injectable()
export class ExamsService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(ExamResult.name) private resultModel: Model<ExamResultDocument>,
  ) {}

  listExams(filter: any = {}) {
    return this.examModel.find(filter).populate('batch', 'name code').sort({ scheduledAt: -1 }).exec();
  }

  examById(id: string) {
    return this.examModel.findById(id).populate('batch', 'name code').exec();
  }

  createExam(data: Partial<Exam>) {
    return this.examModel.create(data);
  }

  async updateExam(id: string, data: Partial<Exam>) {
    const e = await this.examModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!e) throw new NotFoundException('Exam not found');
    return e;
  }

  async removeExam(id: string) {
    const e = await this.examModel.findByIdAndDelete(id).exec();
    await this.resultModel.deleteMany({ exam: id }).exec();
    if (!e) throw new NotFoundException('Exam not found');
    return { ok: true };
  }

  resultsByExam(examId: string) {
    return this.resultModel
      .find({ exam: examId })
      .populate('student', 'name email level institution')
      .sort({ marks: -1 })
      .exec();
  }

  resultsByStudent(studentId: string) {
    return this.resultModel
      .find({ student: studentId })
      .populate('exam', 'title scheduledAt totalMarks')
      .populate('batch', 'name code')
      .sort({ createdAt: -1 })
      .exec();
  }

  async upsertResult(data: {
    exam: string;
    student: string;
    batch: string;
    marks: number;
    totalMarks: number;
    remark?: string;
  }) {
    const r = await this.resultModel
      .findOneAndUpdate(
        { exam: data.exam, student: data.student },
        { $set: data },
        { upsert: true, new: true },
      )
      .exec();
    return r;
  }

  async recomputeRanks(examId: string) {
    const results = await this.resultModel.find({ exam: examId }).sort({ marks: -1 }).exec();
    let rank = 0;
    let prevMarks = -1;
    let counter = 0;
    for (const r of results) {
      counter++;
      if (r.marks !== prevMarks) rank = counter;
      prevMarks = r.marks;
      r.rank = rank;
      await r.save();
    }
    return { ok: true, count: results.length };
  }

  async topPerformers(limit = 3) {
    // For each batch, get the top scorer in the most recent evaluated exam.
    const recentExams = await this.examModel
      .aggregate([
        { $match: { status: 'evaluated' } },
        { $sort: { scheduledAt: -1 } },
        { $group: { _id: '$batch', exam: { $first: '$$ROOT' } } },
      ])
      .exec();

    const results: any[] = [];
    for (const item of recentExams) {
      const top = await this.resultModel
        .find({ exam: item.exam._id })
        .populate('student', 'name level institution')
        .populate('batch', 'name code type')
        .populate('exam', 'title totalMarks scheduledAt')
        .sort({ marks: -1 })
        .limit(limit)
        .exec();
      if (top.length) results.push({ batch: item.exam.batch, top });
    }
    return results;
  }
}
