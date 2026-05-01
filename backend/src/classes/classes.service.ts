import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClassSession, ClassSessionDocument } from './schemas/class.schema';

@Injectable()
export class ClassesService {
  constructor(@InjectModel(ClassSession.name) private model: Model<ClassSessionDocument>) {}

  list(filter: any = {}) {
    return this.model.find(filter).populate('teacher').sort({ scheduledAt: 1 }).exec();
  }

  byBatch(batchId: string) {
    return this.model.find({ batch: batchId }).populate('teacher').sort({ scheduledAt: 1 }).exec();
  }

  byId(id: string) {
    return this.model.findById(id).populate('teacher').exec();
  }

  create(data: Partial<ClassSession>) {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<ClassSession>) {
    const c = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!c) throw new NotFoundException('Class not found');
    return c;
  }

  async remove(id: string) {
    const c = await this.model.findByIdAndDelete(id).exec();
    if (!c) throw new NotFoundException('Class not found');
    return { ok: true };
  }
}
