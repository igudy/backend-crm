import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerSchema } from 'src/customer/entities/customer.entity';
import { JobSchema } from './entities/job.entity';
import { AppointmentSchema } from './entities/appointment.entity';
import { UserSchema } from 'src/user/entity/user.entity';
import { InvoiceSchema } from 'src/invoice/entities/invoice.entity';
import { InvoiceModule } from 'src/invoice/invoice.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Job', schema: JobSchema },
      { name: 'Customer', schema: CustomerSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Appointment', schema: AppointmentSchema },
      { name: 'Invoice', schema: InvoiceSchema },
    ]),
    InvoiceModule,
  ],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
