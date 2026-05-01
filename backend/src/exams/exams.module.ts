import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Exam, ExamSchema, ExamResult, ExamResultSchema } from './schemas/exam.schema';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: ExamResult.name, schema: ExamResultSchema },
    ]),
  ],
  providers: [ExamsService],
  controllers: [ExamsController],
  exports: [MongooseModule],
})
export class ExamsModule {}
