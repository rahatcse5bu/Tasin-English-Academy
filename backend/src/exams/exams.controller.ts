import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/guards';

@Controller('exams')
export class ExamsController {
  constructor(private service: ExamsService) {}

  @Get('top-performers')
  topPerformers(@Query('limit') limit?: string) {
    return this.service.topPerformers(Number(limit) || 3);
  }

  @Get()
  list(@Query('batch') batch?: string) {
    const filter: any = {};
    if (batch) filter.batch = batch;
    return this.service.listExams(filter);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.service.examById(id);
  }

  @Get(':id/results')
  results(@Param('id') id: string) {
    return this.service.resultsByExam(id);
  }

  @Get('me/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  myResults(@CurrentUser() u: any) {
    return this.service.resultsByStudent(u.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: any) {
    return this.service.createExam(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.updateExam(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.removeExam(id);
  }

  @Post(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addResult(@Param('id') id: string, @Body() body: any) {
    const r = await this.service.upsertResult({ ...body, exam: id });
    await this.service.recomputeRanks(id);
    return r;
  }

  @Post(':id/results/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addResultsBulk(@Param('id') id: string, @Body() body: { results: any[] }) {
    const out: any[] = [];
    for (const r of body.results || []) {
      out.push(await this.service.upsertResult({ ...r, exam: id }));
    }
    await this.service.recomputeRanks(id);
    return out;
  }
}
