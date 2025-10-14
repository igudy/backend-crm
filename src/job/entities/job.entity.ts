import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum JOB_STATUS {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  SCHEDULED = 'scheduled',
  DONE = 'done',
  INVOICED = 'invoiced',
  PAID = 'paid',
}

@Schema({
  timestamps: true,
})
export class Job extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  })
  customer: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: JOB_STATUS,
    default: JOB_STATUS.NEW,
  })
  status: JOB_STATUS;

  @Prop({
    type: String,
    required: true,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
  })
  description: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
