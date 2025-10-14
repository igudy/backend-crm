import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    required: true,
    type: String,
    unique:true
  })
  email: string;

  @Prop({
    required: true,
    type: String,
  })
  phone: string;

  @Prop({
    type: String,
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
