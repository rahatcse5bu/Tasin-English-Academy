import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/guards';
import { UsersService } from '../users/users.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private service: PaymentsService, private users: UsersService) {}

  @Get('me')
  myPayments(@CurrentUser() u: any) {
    return this.service.byStudent(u.sub);
  }

  @Post()
  async create(@Body() body: any, @CurrentUser() u: any) {
    const studentId = u.role === 'admin' && body.student ? body.student : u.sub;
    return this.service.create({
      ...body,
      student: studentId,
      status: u.role === 'admin' ? body.status || 'approved' : 'pending',
    });
  }

  @Get()
  @Roles('admin')
  list(@Query('status') status?: string, @Query('batch') batch?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    if (batch) filter.batch = batch;
    return this.service.list(filter);
  }

  @Get(':id')
  @Roles('admin')
  byId(@Param('id') id: string) {
    return this.service.byId(id);
  }

  @Patch(':id/approve')
  @Roles('admin')
  async approve(@Param('id') id: string, @CurrentUser() u: any) {
    return this.service.approve(id, u.email);
  }

  @Patch(':id/reject')
  @Roles('admin')
  reject(@Param('id') id: string, @CurrentUser() u: any, @Body() body: any) {
    return this.service.reject(id, u.email, body?.note);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
