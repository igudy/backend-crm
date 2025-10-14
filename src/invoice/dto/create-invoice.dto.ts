import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemDto {
  @ApiProperty({
    description: 'Description of the invoice item',
    example: 'Engine repair service',
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Price per unit for the item',
    example: 5000,
  })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({
    description: 'Quantity of items',
    example: 2,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateInvoiceDto {
  @ApiProperty({
    type: [InvoiceItemDto],
    description: 'List of invoice items with description, price, and quantity',
    example: [
      { description: 'Oil change', price: 2000, quantity: 1 },
      { description: 'Filter replacement', price: 1500, quantity: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({
    description: 'Subtotal amount before tax',
    example: 5000,
  })
  @IsNumber()
  @Min(1)
  subTotal: number;

  @ApiProperty({
    description: 'Tax amount applied to the subtotal',
    example: 500,
  })
  @IsNumber()
  @Min(1)
  tax: number;

  @ApiProperty({
    description: 'Final total after adding tax',
    example: 5500,
  })
  @IsNumber()
  @Min(1)
  total: number;
}
