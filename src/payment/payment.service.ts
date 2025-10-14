import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InvoiceService } from '../invoice/invoice.service';
import { JobService } from '../job/job.service';
import { Payment } from './entities/payment.entity';
import { JOB_STATUS, Job } from 'src/job/entities/job.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<Invoice>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<Job>,
  ) {}

  async create(invoiceId: string, createPaymentDto: CreatePaymentDto) {
    const session = await this.paymentModel.db.startSession();
    session.startTransaction();

    try {
      // Validate invoice
      const invoice: any = await this.invoiceModel.findById(invoiceId);
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
      }

      // Validate payment amount matches invoice total
      if (createPaymentDto.amount !== invoice.total) {
        throw new BadRequestException(
          `Payment amount (${createPaymentDto.amount}) must equal invoice total (${invoice.total})`,
        );
      }

      // Update job status to PAID
      const job = await this.jobModel.findById(invoice.job._id);
      if (!job) {
        throw new NotFoundException(`Job for invoice ${invoiceId} not found`);
      }

      job.status = JOB_STATUS.PAID;
      await job.save({ session });

      // Create payment
      const newPayment = await this.paymentModel.create(
        [
          {
            ...createPaymentDto,
            invoice: invoiceId,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return newPayment[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.paymentModel
        .find()
        .populate({
          path: 'invoice',
          populate: {
            path: 'job',
          },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.paymentModel.countDocuments(),
    ]);

    return {
      success: true,
      message: 'Payments retrieved successfully',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.paymentModel.findById(id).populate({
      path: 'invoice',
      populate: {
        path: 'job',
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Payment retrieved successfully',
      data: payment,
    };
  }
}
