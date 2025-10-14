import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { NotFoundException } from '@nestjs/common';

describe('CustomerController', () => {
  let controller: CustomerController;
  let customerService: CustomerService;

  const mockCustomer = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomerService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    customerService = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
      };

      mockCustomerService.create.mockResolvedValue(mockCustomer);

      const result = await controller.create(createCustomerDto);

      expect(result).toEqual(mockCustomer);
      expect(customerService.create).toHaveBeenCalledWith(createCustomerDto);
      expect(customerService.create).toHaveBeenCalledTimes(1);
    });

    it('should handle creation errors', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address:  '123 Main St'
      };

      const error = new Error('Creation failed');
      mockCustomerService.create.mockRejectedValue(error);

      await expect(controller.create(createCustomerDto)).rejects.toThrow(error);
      expect(customerService.create).toHaveBeenCalledWith(createCustomerDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers with default values', async () => {
      const mockResponse = {
        data: [mockCustomer],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockCustomerService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Customers retrieved successfully',
        data: mockResponse.data,
        total: mockResponse.total,
        page: mockResponse.page,
        limit: mockResponse.limit,
      });
      expect(customerService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should return paginated customers with custom pagination', async () => {
      const mockResponse = {
        data: [
          mockCustomer,
          { ...mockCustomer, _id: '507f1f77bcf86cd799439012' },
        ],
        total: 2,
        page: 2,
        limit: 5,
      };

      mockCustomerService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(2, 5);

      expect(result).toEqual({
        success: true,
        message: 'Customers retrieved successfully',
        data: mockResponse.data,
        total: mockResponse.total,
        page: mockResponse.page,
        limit: mockResponse.limit,
      });
      expect(customerService.findAll).toHaveBeenCalledWith(2, 5);
    });

    it('should convert string query parameters to numbers', async () => {
      const mockResponse = {
        data: [mockCustomer],
        total: 1,
        page: 3,
        limit: 20,
      };

      mockCustomerService.findAll.mockResolvedValue(mockResponse);

      // Simulate string query parameters (as they come from HTTP requests)
      const result = await controller.findAll('3' as any, '20' as any);

      expect(result).toEqual({
        success: true,
        message: 'Customers retrieved successfully',
        data: mockResponse.data,
        total: mockResponse.total,
        page: 3,
        limit: 20,
      });
      expect(customerService.findAll).toHaveBeenCalledWith(3, 20);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockCustomerService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
      expect(customerService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a customer by ID', async () => {
      mockCustomerService.findOne.mockResolvedValue(mockCustomer);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual({
        success: true,
        message: 'Customer retrieved successfully',
        data: mockCustomer,
      });
      expect(customerService.findOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(customerService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should handle customer not found', async () => {
      const notFoundError = new NotFoundException('Customer not found');
      mockCustomerService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(customerService.findOne).toHaveBeenCalledWith('invalid-id');
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockCustomerService.findOne.mockRejectedValue(error);

      await expect(
        controller.findOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(error);
      expect(customerService.findOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  // Note: Since your controller only has create, findAll, and findOne methods,
  // I'm not including tests for update and delete. But if you add them later,
  // here's what they would look like:

  describe('update', () => {
    it('should update a customer', async () => {
      // This would be implemented if you add an update endpoint
    });
  });

  describe('remove', () => {
    it('should delete a customer', async () => {
      // This would be implemented if you add a delete endpoint
    });
  });
});
