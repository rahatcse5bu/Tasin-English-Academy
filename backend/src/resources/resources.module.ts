import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Resource, ResourceSchema } from './schemas/resource.schema';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Resource.name, schema: ResourceSchema }]),
    UsersModule,
  ],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [MongooseModule],
})
export class ResourcesModule {}
