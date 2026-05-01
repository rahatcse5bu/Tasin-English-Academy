import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from './schemas/resource.schema';

@Injectable()
export class ResourcesService {
  constructor(@InjectModel(Resource.name) private model: Model<ResourceDocument>) {}

  list(filter: any = {}) {
    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  byId(id: string) {
    return this.model.findById(id).exec();
  }

  create(data: Partial<Resource>) {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<Resource>) {
    const r = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!r) throw new NotFoundException('Resource not found');
    return r;
  }

  async remove(id: string) {
    const r = await this.model.findByIdAndDelete(id).exec();
    if (!r) throw new NotFoundException('Resource not found');
    return { ok: true };
  }
}
