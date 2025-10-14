import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentSchema } from './entities/payment.entity';
import { JobModule } from 'src/job/job.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { JobSchema } from 'src/job/entities/job.entity';
import { InvoiceSchema } from 'src/invoice/entities/invoice.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Payment',
        schema: PaymentSchema,
      },
      {
        name: 'Job',
        schema: JobSchema,
      },
      {
        name: 'Invoice',
        schema: InvoiceSchema,
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
