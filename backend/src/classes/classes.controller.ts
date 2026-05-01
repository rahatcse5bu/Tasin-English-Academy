import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/guards';
import { UsersService } from '../users/users.service';

@Controller('classes')
export class ClassesController {
  constructor(private service: ClassesService, private users: UsersService) {}

  @Get()
  list(@Query('batch') batch?: string) {
    if (batch) return this.service.byBatch(batch);
    return this.service.list();
  }

  @Get(':id')
  async byId(@Param('id') id: string) {
    const c: any = await this.service.byId(id);
    if (!c) return null;
    const obj = c.toObject();
    delete obj.gmeetLink;
    return obj;
  }

  @Get('me/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async byIdAuth(@Param('id') id: string, @CurrentUser() u: any) {
    const c: any = await this.service.byId(id);
    if (!c) return null;
    if (u.role === 'admin') return c;
    const me: any = await this.users.findById(u.sub);
    const enrolled = (me?.enrolledBatches || []).map(String).includes(String(c.batch));
    if (!enrolled) {
      const obj = c.toObject();
      delete obj.gmeetLink;
      return obj;
    }
    return c;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: any) {
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
