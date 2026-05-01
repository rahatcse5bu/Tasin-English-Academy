import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/guards';
import { UsersService } from '../users/users.service';

@Controller('resources')
export class ResourcesController {
  constructor(private service: ResourcesService, private users: UsersService) {}

  @Get('public')
  publicList(@Query('kind') kind?: string, @Query('level') level?: string) {
    const filter: any = { isPublic: true };
    if (kind) filter.kind = kind;
    if (level) filter.level = level;
    return this.service.list(filter);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async authList(
    @CurrentUser() u: any,
    @Query('kind') kind?: string,
    @Query('level') level?: string,
    @Query('batch') batch?: string,
  ) {
    const filter: any = {};
    if (kind) filter.kind = kind;
    if (level) filter.level = level;
    if (batch) filter.batch = batch;
    if (u.role === 'student') {
      // Student sees public resources + resources in their enrolled batches
      const me: any = await this.users.findById(u.sub);
      const ids = (me?.enrolledBatches || []).map(String);
      filter.$or = [{ isPublic: true }, { batch: { $in: ids } }];
    }
    return this.service.list(filter);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.service.byId(id);
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
