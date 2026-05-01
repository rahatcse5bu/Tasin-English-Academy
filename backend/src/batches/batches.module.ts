import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Batch, BatchSchema } from './schemas/batch.schema';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Batch.name, schema: BatchSchema }]),
    UsersModule,
  ],
  providers: [BatchesService],
  controllers: [BatchesController],
  exports: [MongooseModule],
})
export class BatchesModule {}
