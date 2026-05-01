import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Teacher, TeacherDocument } from './schemas/teacher.schema';

@Injectable()
export class TeachersService {
  constructor(@InjectModel(Teacher.name) private model: Model<TeacherDocument>) {}

  list(activeOnly = false) {
    const filter = activeOnly ? { active: true } : {};
    return this.model.find(filter).sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  byId(id: string) {
    return this.model.findById(id).exec();
  }

  create(data: Partial<Teacher>) {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<Teacher>) {
    const t = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!t) throw new NotFoundException('Teacher not found');
    return t;
  }

  async remove(id: string) {
    const t = await this.model.findByIdAndDelete(id).exec();
    if (!t) throw new NotFoundException('Teacher not found');
    return { ok: true };
  }
}
