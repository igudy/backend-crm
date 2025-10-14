import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Job, JOB_STATUS } from '../job/entities/job.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('PaymentService', () => {
  let service: PaymentService;

  // Mock models
  const mockPaymentModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    db: {
      startSession: jest.fn(),
    },
  };

  const mockInvoiceModel = {
    findById: jest.fn(),
  };

  const mockJobModel = {
    findById: jest.fn(),
  };

  // Mock data
  const mockJob = {
    _id: new Types.ObjectId('671f12e89e7cba7c1f3e9a3b'),
    title: 'Test Job',
    status: JOB_STATUS.INVOICED,
    customer: new Types.ObjectId('507f1f77bcf86cd799439011'),
    save: jest.fn(),
  };

  const mockInvoice = {
    _id: new Types.ObjectId('671f12e89e7cba7c1f3e9a3c'),
    job: mockJob,
    total: 5000,
    subTotal: 4500,
    tax: 500,
    invoiceNumber: 'INV-123456',
  };

  const mockPayment = {
    _id: new Types.ObjectId('671f12e89e7cba7c1f3e9a3d'),
    invoice: mockInvoice._id,
    amount: 5000,
    payment_method: 'card',
    createdAt: new Date(),
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
        PaymentService,
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
        {
          provide: getModelToken(Invoice.name),
          useValue: mockInvoiceModel,
        },
        {
          provide: getModelToken(Job.name),
          useValue: mockJobModel,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup common mock implementations
    mockPaymentModel.db.startSession.mockResolvedValue(mockSession);
    mockJob.save.mockResolvedValue(mockJob);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPaymentDto: CreatePaymentDto = {
      amount: 5000,
      payment_method: 'card',
    };

    it('should create payment successfully and update job status to PAID', async () => {
      mockInvoiceModel.findById.mockResolvedValue(mockInvoice);
      mockJobModel.findById.mockResolvedValue(mockJob);
      mockPaymentModel.create.mockResolvedValue([mockPayment]);

      const result = await service.create(
        mockInvoice._id.toString(),
        createPaymentDto,
      );

      expect(result).toEqual(mockPayment);
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();

      expect(mockInvoiceModel.findById).toHaveBeenCalledWith(
        mockInvoice._id.toString(),
      );
      expect(mockJobModel.findById).toHaveBeenCalledWith(
        mockJob._id.toString(),
      );
      expect(mockJob.status).toBe(JOB_STATUS.PAID);
      expect(mockJob.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockPaymentModel.create).toHaveBeenCalledWith(
        [
          {
            ...createPaymentDto,
            invoice: mockInvoice._id.toString(),
          },
        ],
        { session: mockSession },
      );
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      const invalidInvoiceId = '671f12e89e7cba7c1f3e9a3f';
      mockInvoiceModel.findById.mockResolvedValue(null);

      await expect(
        service.create(invalidInvoiceId, createPaymentDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(invalidInvoiceId, createPaymentDto),
      ).rejects.toThrow(`Invoice with ID ${invalidInvoiceId} not found`);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment amount does not match invoice total', async () => {
      mockInvoiceModel.findById.mockResolvedValue(mockInvoice);

      const invalidPaymentDto: CreatePaymentDto = {
        amount: 4000, // Different from invoice total (5000)
        payment_method: 'card',
      };

      await expect(
        service.create(mockInvoice._id.toString(), invalidPaymentDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockInvoice._id.toString(), invalidPaymentDto),
      ).rejects.toThrow(
        `Payment amount (4000) must equal invoice total (5000)`,
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job for invoice is not found', async () => {
      mockInvoiceModel.findById.mockResolvedValue(mockInvoice);
      mockJobModel.findById.mockResolvedValue(null);

      await expect(
        service.create(mockInvoice._id.toString(), createPaymentDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(mockInvoice._id.toString(), createPaymentDto),
      ).rejects.toThrow(
        `Job for invoice ${mockInvoice._id.toString()} not found`,
      );

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should handle database errors during payment creation', async () => {
      mockInvoiceModel.findById.mockResolvedValue(mockInvoice);
      mockJobModel.findById.mockResolvedValue(mockJob);

      const databaseError = new Error('Database connection failed');
      mockPaymentModel.create.mockRejectedValue(databaseError);

      await expect(
        service.create(mockInvoice._id.toString(), createPaymentDto),
      ).rejects.toThrow(databaseError);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated payments with default values', async () => {
      const mockPayments = [mockPayment];
      const totalCount = 1;

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });

      mockPaymentModel.countDocuments.mockResolvedValue(totalCount);

      const result = await service.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Payments retrieved successfully',
        data: mockPayments,
        meta: {
          total: totalCount,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      expect(mockPaymentModel.find).toHaveBeenCalled();
      expect(mockPaymentModel.countDocuments).toHaveBeenCalled();
    });

    it('should return paginated payments with custom pagination', async () => {
      const mockPayments = [
        mockPayment,
        { ...mockPayment, _id: new Types.ObjectId() },
      ];
      const totalCount = 15;

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });

      mockPaymentModel.countDocuments.mockResolvedValue(totalCount);

      const result = await service.findAll(2, 5);

      expect(result).toEqual({
        success: true,
        message: 'Payments retrieved successfully',
        data: mockPayments,
        meta: {
          total: totalCount,
          page: 2,
          limit: 5,
          totalPages: 3, // Math.ceil(15 / 5) = 3
        },
      });

      // Verify skip calculation: (page - 1) * limit = (2 - 1) * 5 = 5
      const skipCall = mockPaymentModel.find().populate().skip;
      expect(skipCall).toHaveBeenCalledWith(5);
    });

    it('should populate invoice and job relationships', async () => {
      const mockPayments = [mockPayment];
      const totalCount = 1;

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });

      mockPaymentModel.countDocuments.mockResolvedValue(totalCount);

      await service.findAll();

      expect(mockPaymentModel.find().populate).toHaveBeenCalledWith({
        path: 'invoice',
        populate: {
          path: 'job',
        },
      });
    });

    it('should sort payments by createdAt descending', async () => {
      const mockPayments = [mockPayment];
      const totalCount = 1;

      mockPaymentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockPayments),
            }),
          }),
        }),
      });

      mockPaymentModel.countDocuments.mockResolvedValue(totalCount);

      await service.findAll();

      const sortCall = mockPaymentModel.find().populate().skip().limit().sort;
      expect(sortCall).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findOne', () => {
    it('should return a payment when found', async () => {
      const paymentId = '671f12e89e7cba7c1f3e9a3d';

      mockPaymentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await service.findOne(paymentId);

      expect(result).toEqual({
        success: true,
        message: 'Payment retrieved successfully',
        data: mockPayment,
      });

      expect(mockPaymentModel.findById).toHaveBeenCalledWith(paymentId);
      expect(mockPaymentModel.findById().populate).toHaveBeenCalledWith({
        path: 'invoice',
        populate: {
          path: 'job',
        },
      });
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      const paymentId = 'nonexistent-id';

      mockPaymentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(paymentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(paymentId)).rejects.toThrow(
        `Payment with ID ${paymentId} not found`,
      );
    });

    it('should handle database errors', async () => {
      const paymentId = '671f12e89e7cba7c1f3e9a3d';
      const databaseError = new Error('Database error');

      mockPaymentModel.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(databaseError),
      });

      await expect(service.findOne(paymentId)).rejects.toThrow(databaseError);
    });
  });

  describe('payment method validation', () => {
    const createPaymentDto: CreatePaymentDto = {
      amount: 5000,
      payment_method: 'card',
    };

    it('should accept valid payment methods', async () => {
      mockInvoiceModel.findById.mockResolvedValue(mockInvoice);
      mockJobModel.findById.mockResolvedValue(mockJob);
      mockPaymentModel.create.mockResolvedValue([mockPayment]);

      // Test all valid payment methods
      const validMethods = ['card', 'bank', 'cash'];

      for (const method of validMethods) {
        const dto = { ...createPaymentDto, payment_method: method };
        mockPaymentModel.create.mockClear();

        await service.create(mockInvoice._id.toString(), dto);

        expect(mockPaymentModel.create).toHaveBeenCalledWith(
          [
            {
              ...dto,
              invoice: mockInvoice._id.toString(),
            },
          ],
          { session: mockSession },
        );
      }
    });

    // Note: The DTO validation will handle invalid payment methods before reaching the service
  });
});
