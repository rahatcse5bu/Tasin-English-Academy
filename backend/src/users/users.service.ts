import * as bcrypt from 'bcryptjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  list(filter: any = {}) {
    return this.userModel
      .find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-passwordHash')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string) {
    const r = await this.userModel.findByIdAndDelete(id).exec();
    if (!r) throw new NotFoundException('User not found');
    return { ok: true };
  }

  enroll(userId: string, batchId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { enrolledBatches: batchId } },
        { new: true },
      )
      .select('-passwordHash')
      .exec();
  }

  unenroll(userId: string, batchId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { enrolledBatches: batchId } },
        { new: true },
      )
      .select('-passwordHash')
      .exec();
  }

  /** Create a login for a mentor or another admin. Used by POST /api/users/staff. */
  async createStaff(data: { name: string; email: string; password: string; role?: 'teacher' | 'admin' }) {
    const email = data.email.toLowerCase().trim();
    const existing = await this.findByEmail(email);
    if (existing) {
      // already a user — just make sure the role is right
      existing.role = data.role || 'teacher';
      await existing.save();
      return { id: existing._id, email: existing.email, role: existing.role, created: false };
    }
    const user = await this.create({
      name: data.name,
      email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role || 'teacher',
    } as any);
    return { id: (user as any)._id, email, role: data.role || 'teacher', created: true };
  }
}
