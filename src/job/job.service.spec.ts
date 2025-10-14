import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JobService } from './job.service';
import { Job, JOB_STATUS } from './entities/job.entity';
import { Customer } from '../customer/entities/customer.entity';
import { User } from '../user/entity/user.entity';
import { Appointment } from './entities/appointment.entity';
import { InvoiceService } from '../invoice/invoice.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

describe('JobService', () => {
  let service: JobService;

  // Mock models
  const mockJobModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    db: {
      startSession: jest.fn(),
    },
  };

  const mockCustomerModel = {
    findById: jest.fn(),
  };

  const mockUserModel = {
    findById: jest.fn(),
  };

  const mockAppointmentModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    db: {
      startSession: jest.fn(),
    },
  };

  const mockInvoiceService = {
    createInvoice: jest.fn(),
  };

  // Mock data
  const mockCustomer = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockJob = {
    _id: new Types.ObjectId('671f12e89e7cba7c1f3e9a3b'),
    title: 'Test Job',
    description: 'Test Description',
    status: JOB_STATUS.NEW,
    customer: mockCustomer,
    assignedTeam: 'team123',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    populate: jest.fn(),
  };

  const mockUser = {
    _id: new Types.ObjectId('671f6b4523cf1d5f62a7a3b9'),
    name: 'Technician User',
    email: 'tech@example.com',
  };

  const mockAppointment = {
    _id: new Types.ObjectId('671f6b4523cf1d5f62a7a3b8'),
    job: mockJob._id,
    technician: mockUser._id,
    start_date: new Date('2024-12-25T09:00:00Z'),
    end_date: new Date('2024-12-25T11:00:00Z'),
  };

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: getModelToken(Job.name),
          useValue: mockJobModel,
        },
        {
          provide: getModelToken(Customer.name),
          useValue: mockCustomerModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Appointment.name),
          useValue: mockAppointmentModel,
        },
        {
          provide: InvoiceService,
          useValue: mockInvoiceService,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup common mock implementations
    mockJobModel.db.startSession.mockResolvedValue(mockSession);
    mockAppointmentModel.db.startSession.mockResolvedValue(mockSession);
    mockJob.populate.mockImplementation(function () {
      return this;
    });
    mockJob.save.mockResolvedValue(mockJob);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createJobDto: CreateJobDto = {
      customer: '507f1f77bcf86cd799439011',
      title: 'Test Job',
      description: 'Test Description',
    };

    it('should create a job successfully', async () => {
      mockCustomerModel.findById.mockResolvedValue(mockCustomer);
      mockJobModel.findOne.mockResolvedValue(null);
      mockJobModel.create.mockResolvedValue(mockJob);

      const result = await service.create(createJobDto);

      expect(result).toEqual(mockJob);
      expect(mockCustomerModel.findById).toHaveBeenCalledWith(
        createJobDto.customer,
      );
      expect(mockJobModel.findOne).toHaveBeenCalledWith({
        title: createJobDto.title,
        customer: createJobDto.customer,
      });
      expect(mockJobModel.create).toHaveBeenCalledWith(createJobDto);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockCustomerModel.findById.mockResolvedValue(null);

      await expect(service.create(createJobDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createJobDto)).rejects.toThrow(
        'Customer not found',
      );

      expect(mockJobModel.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when job with same title exists for customer', async () => {
      mockCustomerModel.findById.mockResolvedValue(mockCustomer);
      mockJobModel.findOne.mockResolvedValue(mockJob);

      await expect(service.create(createJobDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createJobDto)).rejects.toThrow(
        'A job with this title already exists for the customer',
      );

      expect(mockJobModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all jobs with default pagination', async () => {
      const mockJobs = [mockJob];
      const totalCount = 1;

      mockJobModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockJobs),
              }),
            }),
          }),
        }),
      });

      mockJobModel.countDocuments.mockResolvedValue(totalCount);

      const result = await service.findAll();

      expect(result).toEqual({
        data: mockJobs,
        total: totalCount,
        page: 1,
        limit: 10,
      });

      expect(mockJobModel.find).toHaveBeenCalledWith({});
      expect(mockJobModel.countDocuments).toHaveBeenCalledWith({});
    });

    it('should return filtered jobs by status', async () => {
      const mockJobs = [mockJob];
      const totalCount = 1;

      mockJobModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockJobs),
              }),
            }),
          }),
        }),
      });

      mockJobModel.countDocuments.mockResolvedValue(totalCount);

      const result = await service.findAll(JOB_STATUS.IN_PROGRESS, 2, 5);

      expect(result).toEqual({
        data: mockJobs,
        total: totalCount,
        page: 2,
        limit: 5,
      });

      expect(mockJobModel.find).toHaveBeenCalledWith({
        status: JOB_STATUS.IN_PROGRESS,
      });
    });
  });

  describe('findOne', () => {
    it('should return a job when found', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';

      mockJobModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockJob),
        }),
      });

      const result = await service.findOne(jobId);

      expect(result).toEqual(mockJob);
      expect(mockJobModel.findById).toHaveBeenCalledWith(jobId);
    });

    it('should throw NotFoundException for invalid ObjectId', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(invalidId)).rejects.toThrow(
        `Invalid job ID: ${invalidId}`,
      );

      expect(mockJobModel.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when job not found', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';

      mockJobModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne(jobId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(jobId)).rejects.toThrow(
        `Job with ID ${jobId} not found`,
      );
    });
  });

  describe('scheduleAppointment', () => {
    const createAppointmentDto: CreateAppointmentDto = {
      technician_id: '671f6b4523cf1d5f62a7a3b9',
      start_date: '2024-12-25T09:00:00.000Z',
      end_date: '2024-12-25T11:00:00.000Z',
    };

    it('should schedule appointment successfully', async () => {
      mockUserModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockUser),
      });

      mockJobModel.findById.mockReturnValue({
        session: jest
          .fn()
          .mockResolvedValue({ ...mockJob, status: JOB_STATUS.NEW }),
      });

      mockAppointmentModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      mockAppointmentModel.create.mockResolvedValue([mockAppointment]);

      const result = await service.scheduleAppointment(
        mockJob._id.toString(),
        createAppointmentDto,
      );

      expect(result).toEqual(mockAppointment);
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockUserModel.findById).toHaveBeenCalledWith(
        createAppointmentDto.technician_id,
      );
    });

    it('should throw BadRequestException when end date is before start date', async () => {
      const invalidDto = {
        ...createAppointmentDto,
        start_date: '2024-12-25T11:00:00.000Z',
        end_date: '2024-12-25T09:00:00.000Z',
      };

      await expect(
        service.scheduleAppointment(mockJob._id.toString(), invalidDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when technician not found', async () => {
      mockUserModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.scheduleAppointment(
          mockJob._id.toString(),
          createAppointmentDto,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job not found', async () => {
      mockUserModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockUser),
      });

      mockJobModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.scheduleAppointment(
          mockJob._id.toString(),
          createAppointmentDto,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when job status is not NEW', async () => {
      mockUserModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockUser),
      });

      mockJobModel.findById.mockReturnValue({
        session: jest
          .fn()
          .mockResolvedValue({ ...mockJob, status: JOB_STATUS.IN_PROGRESS }),
      });

      await expect(
        service.scheduleAppointment(
          mockJob._id.toString(),
          createAppointmentDto,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException when technician has overlapping appointment', async () => {
      mockUserModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockUser),
      });

      mockJobModel.findById.mockReturnValue({
        session: jest
          .fn()
          .mockResolvedValue({ ...mockJob, status: JOB_STATUS.NEW }),
      });

      mockAppointmentModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockAppointment),
      });

      await expect(
        service.scheduleAppointment(
          mockJob._id.toString(),
          createAppointmentDto,
        ),
      ).rejects.toThrow(ConflictException);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update status from SCHEDULED to IN_PROGRESS successfully', async () => {
      const scheduledJob = { ...mockJob, status: JOB_STATUS.SCHEDULED };

      mockJobModel.findById.mockResolvedValue(scheduledJob);

      const result = await service.updateStatus(
        mockJob._id.toString(),
        JOB_STATUS.IN_PROGRESS,
      );

      expect(result).toEqual(scheduledJob);
      expect(scheduledJob.status).toBe(JOB_STATUS.IN_PROGRESS);
      expect(scheduledJob.save).toHaveBeenCalled();
    });

    it('should update status from IN_PROGRESS to DONE successfully', async () => {
      const inProgressJob = { ...mockJob, status: JOB_STATUS.IN_PROGRESS };

      mockJobModel.findById.mockResolvedValue(inProgressJob);

      const result = await service.updateStatus(
        mockJob._id.toString(),
        JOB_STATUS.DONE,
      );

      expect(result).toEqual(inProgressJob);
      expect(inProgressJob.status).toBe(JOB_STATUS.DONE);
      expect(inProgressJob.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status', async () => {
      mockJobModel.findById.mockResolvedValue(mockJob);

      await expect(
        service.updateStatus(
          mockJob._id.toString(),
          'INVALID_STATUS' as JOB_STATUS,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobModel.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus(mockJob._id.toString(), JOB_STATUS.IN_PROGRESS),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      mockJobModel.findById.mockResolvedValue(mockJob);

      await expect(
        service.updateStatus(mockJob._id.toString(), JOB_STATUS.IN_PROGRESS),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createInvoice', () => {
    const createInvoiceDto: CreateInvoiceDto = {
      items: [{ description: 'Service Fee', price: 100, quantity: 1 }],
      tax: 10,
      subTotal: 100,
      total: 110,
    };

    it('should create invoice successfully', async () => {
      const doneJob = { ...mockJob, status: JOB_STATUS.DONE };

      mockJobModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(doneJob),
      });

      mockInvoiceService.createInvoice.mockResolvedValue({
        _id: new Types.ObjectId(),
        invoiceNumber: 'INV-123',
        total: 110,
      });

      const result = await service.createInvoice(
        mockJob._id.toString(),
        createInvoiceDto,
      );

      expect(result).toBeDefined();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(doneJob.status).toBe(JOB_STATUS.INVOICED);
      expect(doneJob.save).toHaveBeenCalled();
      expect(mockInvoiceService.createInvoice).toHaveBeenCalledWith(
        mockJob._id.toString(),
        createInvoiceDto,
        mockSession,
      );
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.createInvoice(mockJob._id.toString(), createInvoiceDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when job status is not DONE', async () => {
      mockJobModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockJob), // status is NEW
      });

      await expect(
        service.createInvoice(mockJob._id.toString(), createInvoiceDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });
});
