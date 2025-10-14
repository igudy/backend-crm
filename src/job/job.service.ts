import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JOB_STATUS, Job } from './entities/job.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from 'src/customer/entities/customer.entity';
import { Model, Types } from 'mongoose';
import { User } from 'src/user/entity/user.entity';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateInvoiceDto } from 'src/invoice/dto/create-invoice.dto';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { InvoiceService } from 'src/invoice/invoice.service';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    private readonly invoiceService: InvoiceService,
  ) {}
  async create(createJobDto: CreateJobDto): Promise<Job> {
    // validate customer existence
    const customer = await this.customerModel.findById(createJobDto.customer);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // check if a job with the same title already exists for this customer
    const existingJob = await this.jobModel.findOne({
      title: createJobDto.title,
      customer: createJobDto.customer,
    });

    if (existingJob) {
      throw new ConflictException(
        'A job with this title already exists for the customer',
      );
    }

    // create job
    const job = this.jobModel.create(createJobDto);

    return job;
  }

  async findAll(
    status?: JOB_STATUS,
    page = 1,
    limit = 10,
  ): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
    const filter = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.jobModel
        .find(filter)
        .populate('customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.jobModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Job> {
    // Validate that id is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid job ID: ${id}`);
    }

    const job = await this.jobModel.findById(id).populate('customer').exec();

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async scheduleAppointment(
    jobId: string,
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const session = await this.appointmentModel.db.startSession();
    session.startTransaction();

    try {
      // Validate that endDate is greater than startDate
      if (new Date(createAppointmentDto.end_date) <= new Date(createAppointmentDto.start_date)) {
        throw new BadRequestException(
          'End date must come after start date',
        );
      }

      // Validate technician
      const user = await this.userModel
        .findById(createAppointmentDto.technician_id)
        .session(session);
      if (!user) {
        throw new NotFoundException('Technician not found');
      }

      // Validate job status
      const job = await this.jobModel.findById(jobId).session(session);
      if (!job) {
        throw new NotFoundException('Job not found');
      }

      if (job.status !== JOB_STATUS.NEW) {
        throw new BadRequestException(
          'Can only schedule appointment for job with status NEW',
        );
      }

      // Validate technician availability (no overlapping appointments)
      const overlappingAppointment = await this.appointmentModel
        .findOne({
          technician: createAppointmentDto.technician_id,
          start_date: { $lt: createAppointmentDto.end_date },
          end_date: { $gt: createAppointmentDto.start_date },
        })
        .session(session);

      if (overlappingAppointment) {
        const { start_date, end_date } = overlappingAppointment;
        throw new ConflictException(
          `Technician already has an active appointment during this time frame: 
        ${new Date(createAppointmentDto.start_date).toLocaleString()} - ${new Date(createAppointmentDto.end_date).toLocaleString()}`,
        );
      }

      // Update job status to SCHEDULED
      job.status = JOB_STATUS.SCHEDULED;
      await job.save({ session });

      console.log('createAppointmentDto', createAppointmentDto);

      // Create appointment
      const [appointment] = await this.appointmentModel.create(
        [
          {
            ...createAppointmentDto,
            job: jobId,
            technician: createAppointmentDto.technician_id,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return appointment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateStatus(id: string, status: JOB_STATUS): Promise<Job> {
    // Validate status
    if (!Object.values(JOB_STATUS).includes(status)) {
      throw new BadRequestException(`Invalid job status: ${status}`);
    }

    // Find existing job
    const job = await this.jobModel.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // Strictly allowed transitions
    const validTransitions: Record<JOB_STATUS, JOB_STATUS[]> = {
      [JOB_STATUS.SCHEDULED]: [JOB_STATUS.IN_PROGRESS],
      [JOB_STATUS.IN_PROGRESS]: [JOB_STATUS.DONE],
      [JOB_STATUS.NEW]: [],
      [JOB_STATUS.DONE]: [],
      [JOB_STATUS.INVOICED]: [],
      [JOB_STATUS.PAID]: [],
    };

    const allowedNext = validTransitions[job.status] || [];
    if (!allowedNext.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition: ${job.status} → ${status}. Allowed transitions: 
      SCHEDULED → IN_PROGRESS, IN_PROGRESS → DONE`,
      );
    }

    job.status = status;
    await job.save();

    return job.populate('customer');
  }

  async createInvoice(jobId: string, createInvoiceDto: CreateInvoiceDto) {
    const session = await this.jobModel.db.startSession();
    session.startTransaction();

    try {
      // 1. Validate job
      const job = await this.jobModel.findById(jobId).session(session);
      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }

      // 2. Validate job status
      if (job.status !== JOB_STATUS.DONE) {
        throw new BadRequestException(
          'Invoice can only be created for jobs with status DONE',
        );
      }

      // 3. Update job status
      job.status = JOB_STATUS.INVOICED;
      await job.save({ session });

      // 4. Create invoice inside transaction
      const newInvoice = await this.invoiceService.createInvoice(
        jobId,
        createInvoiceDto,
        session,
      );

      // 5. Commit
      await session.commitTransaction();
      return newInvoice;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
