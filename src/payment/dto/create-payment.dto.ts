import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  IsString,
  IsIn,
  IsNotEmpty,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 5000,
    description: 'The amount paid by the customer',
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 'card',
    description: 'Payment method used',
    enum: ['card', 'bank_transfer', 'cash', 'pos', 'wallet'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['card', 'bank', 'cash'], {
    message:
      'payment_method must be one of: card, bank, cash',
  })
  payment_method: string;
}
