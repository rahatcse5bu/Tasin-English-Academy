import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassSession, ClassSessionSchema } from './schemas/class.schema';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { UsersModule } from '../users/users.module';
import { BatchesModule } from '../batches/batches.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ClassSession.name, schema: ClassSessionSchema }]),
    UsersModule,
    BatchesModule,
  ],
  providers: [ClassesService],
  controllers: [ClassesController],
  exports: [MongooseModule],
})
export class ClassesModule {}
