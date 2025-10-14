import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':invoiceId')
  @ApiOperation({ summary: 'Create a payment for a specific invoice' })
  @ApiParam({
    name: 'invoiceId',
    type: String,
    required: true,
    description: 'The ID of the invoice to attach the payment to',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
    schema: {
      example: {
        success: true,
        message: 'Payment created successfully',
        data: {
          _id: '66ffdfb3d12d234aa445ef0a',
          amount: 1500,
          method: 'bank_transfer',
          invoice: '66ffcba82c24a1b78b5c1234',
          createdAt: '2025-10-14T14:00:00Z',
        },
      },
    },
  })
  async create(
    @Param('invoiceId') invoiceId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentService.create(invoiceId, createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve paginated list of payments' })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 10,
    description: 'Number of records per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Payments retrieved successfully',
        data: [
          {
            _id: '66ffdfb3d12d234aa445ef0a',
            amount: 1500,
            method: 'bank_transfer',
            invoice: {
              _id: '66ffcba82c24a1b78b5c1234',
              total: 1500,
              job: {
                _id: '66ffacb62c24a1b78b5c7788',
                title: 'UI Design Project',
                status: 'PAID',
              },
            },
          },
        ],
        meta: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
        },
      },
    },
  })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.paymentService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single payment by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Unique identifier of the payment',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Payment retrieved successfully',
        data: {
          _id: '66ffdfb3d12d234aa445ef0a',
          amount: 1500,
          method: 'bank_transfer',
          invoice: {
            _id: '66ffcba82c24a1b78b5c1234',
            total: 1500,
            job: {
              _id: '66ffacb62c24a1b78b5c7788',
              title: 'UI Design Project',
              status: 'PAID',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentService.findOne(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }
}
