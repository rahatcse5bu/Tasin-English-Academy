import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/guards';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() u: any) {
    return this.users.findById(u.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() u: any, @Body() body: any) {
    delete body.role;
    delete body.passwordHash;
    delete body.email;
    return this.users.update(u.sub, body);
  }

  @Get()
  @Roles('admin')
  list() {
    return this.users.list({ role: 'student' });
  }

  @Get(':id')
  @Roles('admin')
  byId(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.users.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }

  @Patch(':id/enroll/:batchId')
  @Roles('admin')
  enroll(@Param('id') id: string, @Param('batchId') bid: string) {
    return this.users.enroll(id, bid);
  }

  @Patch(':id/unenroll/:batchId')
  @Roles('admin')
  unenroll(@Param('id') id: string, @Param('batchId') bid: string) {
    return this.users.unenroll(id, bid);
  }
}
