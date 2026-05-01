import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(@InjectModel(Payment.name) private model: Model<PaymentDocument>) {}

  list(filter: any = {}) {
    return this.model
      .find(filter)
      .populate('student', 'name email phone level institution')
      .populate('batch', 'name code type monthlyFee')
      .sort({ createdAt: -1 })
      .exec();
  }

  byStudent(studentId: string) {
    return this.model
      .find({ student: studentId })
      .populate('batch', 'name code type monthlyFee')
      .sort({ createdAt: -1 })
      .exec();
  }

  byId(id: string) {
    return this.model
      .findById(id)
      .populate('student', 'name email phone')
      .populate('batch', 'name code monthlyFee')
      .exec();
  }

  create(data: Partial<Payment>) {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<Payment>) {
    const p = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }

  async approve(id: string, reviewer: string) {
    return this.update(id, {
      status: 'approved',
      reviewedBy: reviewer,
      reviewedAt: new Date(),
    });
  }

  async reject(id: string, reviewer: string, note?: string) {
    return this.update(id, {
      status: 'rejected',
      reviewedBy: reviewer,
      reviewedAt: new Date(),
      note,
    });
  }

  async remove(id: string) {
    const p = await this.model.findByIdAndDelete(id).exec();
    if (!p) throw new NotFoundException('Payment not found');
    return { ok: true };
  }
}
