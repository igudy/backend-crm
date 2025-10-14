import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { NotFoundException } from '@nestjs/common';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: PaymentService;

  const mockPaymentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPayment = {
    _id: '66ffdfb3d12d234aa445ef0a',
    amount: 1500,
    payment_method: 'bank',
    invoice: '66ffcba82c24a1b78b5c1234',
    createdAt: '2025-10-14T14:00:00Z',
  };

  const mockPaginatedResponse = {
    success: true,
    message: 'Payments retrieved successfully',
    data: [mockPayment],
    meta: {
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3,
    },
  };

  const mockSinglePaymentResponse = {
    success: true,
    message: 'Payment retrieved successfully',
    data: {
      ...mockPayment,
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment successfully', async () => {
      const invoiceId = '66ffcba82c24a1b78b5c1234';
      const createPaymentDto: CreatePaymentDto = {
        amount: 1500,
        payment_method: 'bank',
      };

      mockPaymentService.create.mockResolvedValue(mockPayment);

      const result = await controller.create(invoiceId, createPaymentDto);

      expect(result).toEqual(mockPayment);
      expect(paymentService.create).toHaveBeenCalledWith(
        invoiceId,
        createPaymentDto,
      );
      expect(paymentService.create).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors during payment creation', async () => {
      const invoiceId = '66ffcba82c24a1b78b5c1234';
      const createPaymentDto: CreatePaymentDto = {
        amount: 1500,
        payment_method: 'bank',
      };

      const error = new Error('Service error');
      mockPaymentService.create.mockRejectedValue(error);

      await expect(
        controller.create(invoiceId, createPaymentDto),
      ).rejects.toThrow(error);
      expect(paymentService.create).toHaveBeenCalledWith(
        invoiceId,
        createPaymentDto,
      );
    });

    it('should handle invalid invoice ID', async () => {
      const invalidInvoiceId = 'invalid-id';
      const createPaymentDto: CreatePaymentDto = {
        amount: 1500,
        payment_method: 'bank',
      };

      const error = new NotFoundException('Invoice not found');
      mockPaymentService.create.mockRejectedValue(error);

      await expect(
        controller.create(invalidInvoiceId, createPaymentDto),
      ).rejects.toThrow(NotFoundException);
      expect(paymentService.create).toHaveBeenCalledWith(
        invalidInvoiceId,
        createPaymentDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated payments with default values', async () => {
      mockPaymentService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll();

      expect(result).toEqual(mockPaginatedResponse);
      expect(paymentService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should return paginated payments with custom pagination', async () => {
      const customResponse = {
        ...mockPaginatedResponse,
        meta: {
          total: 50,
          page: 2,
          limit: 20,
          totalPages: 3,
        },
      };

      mockPaymentService.findAll.mockResolvedValue(customResponse);

      const result = await controller.findAll(2, 20);

      expect(result).toEqual(customResponse);
      expect(paymentService.findAll).toHaveBeenCalledWith(2, 20);
    });

    it('should convert string query parameters to numbers', async () => {
      mockPaymentService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll('3' as any, '15' as any);

      expect(result).toEqual(mockPaginatedResponse);
      expect(paymentService.findAll).toHaveBeenCalledWith(3, 15);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockPaymentService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
      expect(paymentService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a single payment by ID', async () => {
      const paymentId = '66ffdfb3d12d234aa445ef0a';

      mockPaymentService.findOne.mockResolvedValue(mockSinglePaymentResponse);

      const result = await controller.findOne(paymentId);

      expect(result).toEqual(mockSinglePaymentResponse);
      expect(paymentService.findOne).toHaveBeenCalledWith(paymentId);
      expect(paymentService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      const paymentId = 'nonexistent-id';

      // Note: The service already throws NotFoundException, but the controller also checks
      const error = new NotFoundException(
        `Payment with ID ${paymentId} not found`,
      );
      mockPaymentService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(paymentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne(paymentId)).rejects.toThrow(
        `Payment with ID ${paymentId} not found`,
      );

      expect(paymentService.findOne).toHaveBeenCalledWith(paymentId);
    });

    it('should handle service errors', async () => {
      const paymentId = '66ffdfb3d12d234aa445ef0a';
      const error = new Error('Service error');

      mockPaymentService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(paymentId)).rejects.toThrow(error);
      expect(paymentService.findOne).toHaveBeenCalledWith(paymentId);
    });

    it('should return payment with populated invoice and job data', async () => {
      const paymentId = '66ffdfb3d12d234aa445ef0a';

      mockPaymentService.findOne.mockResolvedValue(mockSinglePaymentResponse);

      const result = await controller.findOne(paymentId);

      expect(result).toEqual(mockSinglePaymentResponse);
      expect(result.data.invoice).toBeDefined();
    });
  });

  describe('payment method validation', () => {
    it('should accept valid payment methods', async () => {
      const invoiceId = '66ffcba82c24a1b78b5c1234';
      const validPaymentMethods = ['card', 'bank', 'cash'];

      mockPaymentService.create.mockResolvedValue(mockPayment);

      for (const method of validPaymentMethods) {
        const createPaymentDto: CreatePaymentDto = {
          amount: 1500,
          payment_method: method as any,
        };

        await controller.create(invoiceId, createPaymentDto);

        expect(paymentService.create).toHaveBeenCalledWith(
          invoiceId,
          createPaymentDto,
        );
      }
    });
  });

  describe('error scenarios', () => {
    it('should handle amount mismatch error', async () => {
      const invoiceId = '66ffcba82c24a1b78b5c1234';
      const createPaymentDto: CreatePaymentDto = {
        amount: 1000, // Different from invoice total
        payment_method: 'bank',
      };

      const error = new Error(
        'Payment amount (1000) must equal invoice total (1500)',
      );
      mockPaymentService.create.mockRejectedValue(error);

      await expect(
        controller.create(invoiceId, createPaymentDto),
      ).rejects.toThrow(error);
    });

    it('should handle invalid payment data', async () => {
      const invoiceId = '66ffcba82c24a1b78b5c1234';
      const createPaymentDto: CreatePaymentDto = {
        amount: -100, // Invalid amount
        payment_method: 'bank',
      };

      const error = new Error('Invalid payment data');
      mockPaymentService.create.mockRejectedValue(error);

      await expect(
        controller.create(invoiceId, createPaymentDto),
      ).rejects.toThrow(error);
    });
  });
});
