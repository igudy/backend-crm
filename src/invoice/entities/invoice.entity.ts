import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Invoice extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Job',
    required: true,
  })
  job: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  invoiceNumber: string;

  @Prop({
    type: [
      {
        description: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    required: true,
  })
  items: { description: string; price: number; quantity: number }[];

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  tax: Number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  subTotal: number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  total: number;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
