import { Test, TestingModule } from '@nestjs/testing';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';
import { JOB_STATUS } from './entities/job.entity';
import { Response } from 'express';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('JobController', () => {
  let controller: JobController;
  let jobService: JobService;

  const mockJobService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    scheduleAppointment: jest.fn(),
    createInvoice: jest.fn(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockJob = {
    _id: '671f12e89e7cba7c1f3e9a3b',
    title: 'Test Job',
    description: 'Test Description',
    status: JOB_STATUS.NEW,
    customer: '507f1f77bcf86cd799439011',
    assignedTeam: 'team123',
    scheduledDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        {
          provide: JobService,
          useValue: mockJobService,
        },
      ],
    }).compile();

    controller = module.get<JobController>(JobController);
    jobService = module.get<JobService>(JobService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new job successfully', async () => {
      const createJobDto: CreateJobDto = {
        title: 'Test Job',
        description: 'Test Description',
        customer: '507f1f77bcf86cd799439011',
      };

      const res = mockResponse();
      mockJobService.create.mockResolvedValue(mockJob);

      await controller.create(createJobDto, res as Response);

      expect(jobService.create).toHaveBeenCalledWith(createJobDto);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Job created successfully',
        data: mockJob,
      });
    });

    it('should handle service errors during job creation', async () => {
      const createJobDto: CreateJobDto = {
        title: 'Test Job',
        description: 'Test Description',
        customer: '507f1f77bcf86cd799439011',
      };

      const res = mockResponse();
      const error = new Error('Service error');
      mockJobService.create.mockRejectedValue(error);

      await expect(
        controller.create(createJobDto, res as Response),
      ).rejects.toThrow(error);
      expect(jobService.create).toHaveBeenCalledWith(createJobDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated jobs with default values', async () => {
      const mockResults = {
        data: [mockJob],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      const res = mockResponse();
      mockJobService.findAll.mockResolvedValue(mockResults);

      await controller.findAll(res as Response);

      expect(jobService.findAll).toHaveBeenCalledWith(undefined, 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Jobs retrieved successfully',
        ...mockResults,
      });
    });

    it('should return paginated jobs with status filter and custom pagination', async () => {
      const mockResults = {
        data: [mockJob],
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      };

      const res = mockResponse();
      mockJobService.findAll.mockResolvedValue(mockResults);

      await controller.findAll(res as Response, JOB_STATUS.IN_PROGRESS, 2, 5);

      expect(jobService.findAll).toHaveBeenCalledWith(
        JOB_STATUS.IN_PROGRESS,
        2,
        5,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Jobs retrieved successfully',
        ...mockResults,
      });
    });

    it('should convert string page and limit to numbers', async () => {
      const mockResults = {
        data: [mockJob],
        total: 1,
        page: 3,
        limit: 20,
        totalPages: 1,
      };

      const res = mockResponse();
      mockJobService.findAll.mockResolvedValue(mockResults);

      await controller.findAll(
        res as Response,
        undefined,
        '3' as any,
        '20' as any,
      );

      expect(jobService.findAll).toHaveBeenCalledWith(undefined, 3, 20);
    });
  });

  describe('findOne', () => {
    it('should return a single job by ID', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';
      const res = mockResponse();
      mockJobService.findOne.mockResolvedValue(mockJob);

      await controller.findOne(jobId, res as Response);

      expect(jobService.findOne).toHaveBeenCalledWith(jobId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Job retrieved successfully',
        data: mockJob,
      });
    });

    it('should handle job not found', async () => {
      const jobId = 'nonexistent-id';
      const res = mockResponse();
      const error = new NotFoundException('Job not found');
      mockJobService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(jobId, res as Response)).rejects.toThrow(
        NotFoundException,
      );
      expect(jobService.findOne).toHaveBeenCalledWith(jobId);
    });
  });

  describe('updateStatus', () => {
    it('should update job status successfully', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';
      const status = JOB_STATUS.IN_PROGRESS;
      const updatedJob = { ...mockJob, status };

      const res = mockResponse();
      mockJobService.updateStatus.mockResolvedValue(updatedJob);

      await controller.updateStatus(jobId, status, res as Response);

      expect(jobService.updateStatus).toHaveBeenCalledWith(jobId, status);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Job status updated successfully',
        data: updatedJob,
      });
    });

    it('should handle invalid status transitions', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';
      const status = JOB_STATUS.DONE; // Invalid transition from NEW to DONE

      const res = mockResponse();
      const error = new BadRequestException('Invalid status transition');
      mockJobService.updateStatus.mockRejectedValue(error);

      await expect(
        controller.updateStatus(jobId, status, res as Response),
      ).rejects.toThrow(BadRequestException);
      expect(jobService.updateStatus).toHaveBeenCalledWith(jobId, status);
    });
  });

  describe('scheduleAppointment', () => {
    it('should schedule appointment successfully', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';
      const createAppointmentDto: CreateAppointmentDto = {
        start_date: '2025-10-25T10:00:00Z',
        end_date: '2025-12-25T10:00:00Z',
        technician_id: '67655BaDf665746',
      };

      const scheduledJob = {
        ...mockJob,
        status: JOB_STATUS.SCHEDULED,
      };

      const res = mockResponse();
      mockJobService.scheduleAppointment.mockResolvedValue(scheduledJob);

      await controller.scheduleAppointment(
        createAppointmentDto,
        jobId,
        res as Response,
      );

      expect(jobService.scheduleAppointment).toHaveBeenCalledWith(
        jobId,
        createAppointmentDto,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: `appointment scheduled for job with id: ${jobId}`,
        data: scheduledJob,
      });
    });

    it('should handle scheduling errors', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';
      const createAppointmentDto: CreateAppointmentDto = {
        start_date: '2025-10-25T10:00:00Z',
        end_date: '2025-12-25T10:00:00Z',
        technician_id: '67655BaDf665746',
      };

      const res = mockResponse();
      const error = new BadRequestException(
        'Cannot schedule appointment for non-NEW job',
      );
      mockJobService.scheduleAppointment.mockRejectedValue(error);

      await expect(
        controller.scheduleAppointment(
          createAppointmentDto,
          jobId,
          res as Response,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(jobService.scheduleAppointment).toHaveBeenCalledWith(
        jobId,
        createAppointmentDto,
      );
    });
  });

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';
      const createInvoiceDto: CreateInvoiceDto = {
        items: [
          { description: 'Service Fee', price: 100, quantity: 1 },
          { description: 'Materials', price: 50, quantity: 2 },
        ],
        tax: 10,
        subTotal:100,
        total:110
      };

      const mockInvoice = {
        _id: 'invoice123',
        job: jobId,
        items: createInvoiceDto.items,
        subTotal: 200,
        tax: 10,
        total: 220,
        invoiceNumber: 'INV-123456',
      };

      const res = mockResponse();
      mockJobService.createInvoice.mockResolvedValue(mockInvoice);

      await controller.createInvoice(jobId, createInvoiceDto, res as Response);

      expect(jobService.createInvoice).toHaveBeenCalledWith(
        jobId,
        createInvoiceDto,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: `Invoice generated for job with id: ${jobId}`,
        data: mockInvoice,
      });
    });

    it('should handle invoice creation errors', async () => {
      const jobId = '671f12e89e7cba7c1f3e9a3b';
      const createInvoiceDto: CreateInvoiceDto = {
        items: [{ description: 'Service Fee', price: 100, quantity: 1 }],
        tax: 10,
        subTotal: 100,
        total:110
      };

      const res = mockResponse();
      const error = new BadRequestException(
        'Cannot create invoice for non-DONE job',
      );
      mockJobService.createInvoice.mockRejectedValue(error);

      await expect(
        controller.createInvoice(jobId, createInvoiceDto, res as Response),
      ).rejects.toThrow(BadRequestException);
      expect(jobService.createInvoice).toHaveBeenCalledWith(
        jobId,
        createInvoiceDto,
      );
    });
  });
});
