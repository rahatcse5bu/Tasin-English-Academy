import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/guards';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Get('me')
  myAttendance(@CurrentUser() u: any, @Query('batch') batch?: string) {
    return this.service.byStudent(u.sub, batch);
  }

  @Get('me/stats')
  myStats(@CurrentUser() u: any, @Query('batch') batch?: string) {
    return this.service.stats(u.sub, batch);
  }

  @Get('class/:classId')
  @Roles('admin')
  byClass(@Param('classId') id: string) {
    return this.service.byClass(id);
  }

  @Get('batch/:batchId')
  @Roles('admin')
  byBatch(@Param('batchId') id: string) {
    return this.service.byBatch(id);
  }

  @Post('mark')
  @Roles('admin')
  async mark(@Body() body: { records: any[] }, @CurrentUser() u: any) {
    const records = (body.records || []).map((r) => ({ ...r, markedBy: u.email }));
    return this.service.upsertMany(records);
  }
}
