import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Appointment extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Job',
    required: true,
  })
  job: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  technician: MongooseSchema.Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
    min: new Date(), //cannot create an appointment in the past
  })
  start_date: Date;

  @Prop({
    type: Date,
    required: true,
  })
  end_date: Date;
}


export const AppointmentSchema = SchemaFactory.createForClass(Appointment);