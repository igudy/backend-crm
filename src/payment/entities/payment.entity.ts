import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Payment extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  })
  invoice: MongooseSchema.Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  amount: number;

  @Prop({
    type: String,
    required: true,
  })
  payment_method: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
