import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { PaymentService } from '../payment/payment.service';
import { CreatePaymentDto } from '../payment/dto/create-payment.dto';
import { NotFoundException } from '@nestjs/common';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let invoiceService: InvoiceService;
  let paymentService: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: PaymentService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    invoiceService = module.get<InvoiceService>(InvoiceService);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const mockResponse = {
        data: [
          {
            _id: '1',
            total: 100,
            items: [],
            subTotal: 90,
            tax: 10,
            invoiceNumber: 'INV-123',
            job: 'job123',
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      jest
        .spyOn(invoiceService, 'findAll')
        .mockResolvedValue(mockResponse as any);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual({
        success: true,
        message: 'Invoices retrieved successfully',
        ...mockResponse,
      });
      expect(invoiceService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a single invoice', async () => {
      const mockInvoice = {
        _id: '123',
        total: 200,
        items: [{ description: 'Service', price: 200, quantity: 1 }],
        subTotal: 200,
        tax: 0,
        invoiceNumber: 'INV-123',
        job: { _id: 'job123', name: 'Test Job' },
        createdAt: new Date(),
      };

      jest
        .spyOn(invoiceService, 'findOne')
        .mockResolvedValue(mockInvoice as any);

      const result = await controller.findOne('123');

      expect(result).toEqual({
        success: true,
        message: 'Invoice retrieved successfully',
        data: mockInvoice,
      });
      expect(invoiceService.findOne).toHaveBeenCalledWith('123');
    });
  });

  describe('processPayment', () => {
    it('should initiate payment successfully', async () => {
      const dto: CreatePaymentDto = {
        amount: 200,
        payment_method: 'bank',
      };

      const mockPayment = {
        _id: 'pay123',
        invoice: 'inv456',
        amount: 200,
        paymentMethod: 'bank',
      };

      jest
        .spyOn(paymentService, 'create')
        .mockResolvedValue(mockPayment as any);

      const result = await controller.processPayment(dto, 'inv456');

      expect(result).toEqual({
        success: true,
        message: 'Payment initiated successfully',
        data: mockPayment,
      });
      expect(paymentService.create).toHaveBeenCalledWith('inv456', dto);
    });
  });
});
