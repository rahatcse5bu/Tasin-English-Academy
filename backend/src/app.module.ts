import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeachersModule } from './teachers/teachers.module';
import { BatchesModule } from './batches/batches.module';
import { ClassesModule } from './classes/classes.module';
import { PaymentsModule } from './payments/payments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExamsModule } from './exams/exams.module';
import { ResourcesModule } from './resources/resources.module';
import { LearningModule } from './learning/learning.module';
import { DecksModule } from './decks/decks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    AuthModule,
    UsersModule,
    TeachersModule,
    BatchesModule,
    ClassesModule,
    PaymentsModule,
    AttendanceModule,
    ExamsModule,
    ResourcesModule,
    LearningModule,
    DecksModule,
  ],
})
export class AppModule {}
