import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Invoice } from './entities/invoice.entity';
import mongoose from 'mongoose';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: mongoose.Model<Invoice>,
  ) {}
  async createInvoice(
    jobId: string,
    createInvoiceDto: CreateInvoiceDto,
    session?: any,
  ) {
    const tax = createInvoiceDto.tax; 
    const subTotal = createInvoiceDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const total = subTotal + (subTotal * tax) / 100;

    const invoiceNumber = this.genInvoiceNumber();

    const invoiceData = {
      ...createInvoiceDto,
      job: jobId,
      subTotal,
      tax,
      total,
      invoiceNumber
    };

    const [invoice] = await this.invoiceModel.create([invoiceData], {
      session,
    });
    return invoice;
  }

  async findAll(
    page = 1,
    limit = 10,
    jobId?: string,
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const filter = jobId ? { job: jobId } : {};

    const [data, total] = await Promise.all([
      this.invoiceModel
        .find(filter)
        .populate('job')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.invoiceModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceModel.findById(id).populate('job');
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  private genInvoiceNumber() {
    const prefix = 'INV';
    const timestamp = Date.now(); // Current timestamp
    const randomSuffix = Math.floor(1000 + Math.random() * 9000000000); // Random 10-digit number
    return `${prefix}-${timestamp}-${randomSuffix}`;
  }
}
