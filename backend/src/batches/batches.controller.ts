import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/guards';
import { UsersService } from '../users/users.service';

@Controller('batches')
export class BatchesController {
  constructor(private service: BatchesService, private users: UsersService) {}

  @Get()
  listPublic(@Query('all') all?: string) {
    return this.service.list(all !== '1');
  }

  @Get(':id')
  async byId(@Param('id') id: string) {
    const batch: any = await this.service.byId(id);
    if (!batch) return null;
    const obj = batch.toObject();
    delete obj.gmeetLink; // hide from public; only via /me/batches/:id
    return obj;
  }

  @Get('me/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async byIdAuth(@Param('id') id: string, @CurrentUser() u: any) {
    const batch: any = await this.service.byId(id);
    if (!batch) return null;
    if (u.role === 'admin') return batch;
    const me: any = await this.users.findById(u.sub);
    const enrolled = (me?.enrolledBatches || []).map(String).includes(String(batch._id));
    if (!enrolled) {
      const obj = batch.toObject();
      delete obj.gmeetLink;
      return obj;
    }
    return batch;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: any) {
    if (body.type === 'premium' && !body.maxStudents) body.maxStudents = 10;
    if (body.type === 'general' && !body.maxStudents) body.maxStudents = 30;
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
