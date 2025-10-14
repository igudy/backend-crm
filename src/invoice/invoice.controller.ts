import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentService } from 'src/payment/payment.service';
import { CreatePaymentDto } from 'src/payment/dto/create-payment.dto';

@ApiTags('Invoices')
@Controller('invoice')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all invoices with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved successfully.',
    schema: {
      example: {
        success: true,
        message: 'Invoices retrieved successfully',
        data: {
          items: [
            {
              _id: '652dcb38e28b1d3d3c8e6c1b',
              job: '652dc9e5b6b8bcd9477c4f20',
              items: [{ description: 'Service Fee', price: 100, quantity: 1 }],
              tax: 10,
              subTotal: 100,
              total: 110,
              createdAt: '2025-10-14T09:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items per page (default: 10)',
  })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const result = await this.invoiceService.findAll(page, limit);
    return {
      success: true,
      message: 'Invoices retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved successfully.',
    schema: {
      example: {
        success: true,
        message: 'Invoice retrieved successfully',
        data: {
          _id: '652dcb38e28b1d3d3c8e6c1b',
          job: '652dc9e5b6b8bcd9477c4f20',
          items: [{ description: 'Service Fee', price: 100, quantity: 1 }],
          tax: 10,
          subTotal: 100,
          total: 110,
          createdAt: '2025-10-14T09:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  @ApiParam({ name: 'id', description: 'Invoice ID', type: String })
  async findOne(@Param('id') id: string) {
    const invoice = await this.invoiceService.findOne(id);
    return {
      success: true,
      message: 'Invoice retrieved successfully',
      data: invoice,
    };
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Initiate payment for invoice' })
  @ApiResponse({
    status: 200,
    description: 'Payment initiated successfully.',
    schema: {
      example: {
        success: true,
        message: 'Payment initiated successfully',
        data: {
          _id: '652dcb38e28b1d3d3c8e6c1b',
          invoice: '652dc9e5b6b8bcd9477c4f20',
          amount: 100,
          paymentMethod: 'bank',
        },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Invoice ID', type: String })
  async processPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Param('id') id: string,
  ) {
    const result = await this.paymentService.create(id, createPaymentDto);
    return {
      success: true,
      message: 'Payment initiated successfully',
      data: result,
    };
  }
}
