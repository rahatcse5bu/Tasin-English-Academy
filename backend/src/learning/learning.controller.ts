import { Controller, Get, Param } from '@nestjs/common';
import { LearningService } from './learning.service';

/**
 * Public, read-only curriculum API. No auth — this is free study content.
 * Routes (global prefix `api`):
 *   GET /api/learn/classes
 *   GET /api/learn/:classId
 *   GET /api/learn/:classId/:subjectId
 *   GET /api/learn/:classId/:subjectId/:unitId
 */
@Controller('learn')
export class LearningController {
  constructor(private service: LearningService) {}

  @Get('classes')
  classes() {
    return this.service.classes();
  }

  @Get(':classId')
  getClass(@Param('classId') classId: string) {
    return this.service.getClass(classId);
  }

  @Get(':classId/:subjectId')
  getSubject(@Param('classId') classId: string, @Param('subjectId') subjectId: string) {
    return this.service.getSubject(classId, subjectId);
  }

  @Get(':classId/:subjectId/:unitId')
  getUnit(
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.service.getUnit(classId, subjectId, unitId);
  }
}
