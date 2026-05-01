import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Batch, BatchDocument } from './schemas/batch.schema';

@Injectable()
export class BatchesService {
  constructor(@InjectModel(Batch.name) private model: Model<BatchDocument>) {}

  list(activeOnly = false) {
    const filter = activeOnly ? { active: true } : {};
    return this.model.find(filter).populate('teachers').sort({ createdAt: -1 }).exec();
  }

  byId(id: string) {
    return this.model.findById(id).populate('teachers').exec();
  }

  byCode(code: string) {
    return this.model.findOne({ code }).populate('teachers').exec();
  }

  create(data: Partial<Batch>) {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<Batch>) {
    const b = await this.model.findByIdAndUpdate(id, data, { new: true }).populate('teachers').exec();
    if (!b) throw new NotFoundException('Batch not found');
    return b;
  }

  async remove(id: string) {
    const b = await this.model.findByIdAndDelete(id).exec();
    if (!b) throw new NotFoundException('Batch not found');
    return { ok: true };
  }

  async incrementEnrolled(id: string, delta = 1) {
    return this.model.findByIdAndUpdate(id, { $inc: { enrolledCount: delta } }, { new: true }).exec();
  }
}
