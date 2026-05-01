import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'cash';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Batch', required: true })
  batch: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  month: string; // e.g., "2026-05" (YYYY-MM)

  @Prop({ required: true, enum: ['bkash', 'nagad', 'rocket', 'cash'], default: 'bkash' })
  method: PaymentMethod;

  @Prop({ required: true })
  transactionId: string;

  @Prop({ required: true })
  senderNumber: string;

  @Prop()
  paidAt?: Date;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: PaymentStatus;

  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  note?: string;
}

export type PaymentDocument = Payment & Document;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
