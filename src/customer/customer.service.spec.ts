import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerModel: mongoose.Model<Customer>;

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
    save: jest.fn(),
  };

  const mockCustomerModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getModelToken(Customer.name),
          useValue: mockCustomerModel,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerModel = module.get<mongoose.Model<Customer>>(
      getModelToken(Customer.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCustomerDto: CreateCustomerDto = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St'
    };

    it('should create a new customer successfully', async () => {
      // Mock no existing customer with same email/phone
      mockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock successful creation
      mockCustomerModel.create.mockResolvedValue(mockCustomer);

      const result = await service.create(createCustomerDto);

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerModel.findOne).toHaveBeenCalledWith({
        $or: [
          { email: createCustomerDto.email },
          { phone: createCustomerDto.phone },
        ],
      });
      expect(mockCustomerModel.create).toHaveBeenCalledWith(createCustomerDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      const existingCustomer = {
        ...mockCustomer,
        email: 'john@example.com',
        phone: '+0987654321', // Different phone
      };

      mockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCustomer),
      });

      await expect(service.create(createCustomerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createCustomerDto)).rejects.toThrow(
        'Customer with this email already exists.',
      );

      expect(mockCustomerModel.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when phone already exists', async () => {
      const existingCustomer = {
        ...mockCustomer,
        email: 'different@example.com', // Different email
        phone: '+1234567890',
      };

      mockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCustomer),
      });

      await expect(service.create(createCustomerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createCustomerDto)).rejects.toThrow(
        'Customer with this phone number already exists.',
      );

      expect(mockCustomerModel.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when both email and phone already exist', async () => {
      const existingCustomer = {
        ...mockCustomer,
        email: 'john@example.com',
        phone: '+1234567890',
      };

      mockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCustomer),
      });

      await expect(service.create(createCustomerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createCustomerDto)).rejects.toThrow(
        'Customer with this email and phone number already exists.',
      );

      expect(mockCustomerModel.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      mockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const databaseError = new Error('Database connection failed');
      mockCustomerModel.create.mockRejectedValue(databaseError);

      await expect(service.create(createCustomerDto)).rejects.toThrow(
        databaseError,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated customers with default values', async () => {
      const mockCustomers = [mockCustomer];
      const totalCount = 1;

      mockCustomerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockCustomers),
            }),
          }),
        }),
      });

      mockCustomerModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(totalCount),
      });

      const result = await service.findAll();

      expect(result).toEqual({
        data: mockCustomers,
        total: totalCount,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockCustomerModel.find).toHaveBeenCalled();
      expect(mockCustomerModel.countDocuments).toHaveBeenCalled();
    });

    it('should return paginated customers with custom pagination', async () => {
      const mockCustomers = [
        mockCustomer,
        { ...mockCustomer, _id: '507f1f77bcf86cd799439012' },
      ];
      const totalCount = 15;

      mockCustomerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockCustomers),
            }),
          }),
        }),
      });

      mockCustomerModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(totalCount),
      });

      const result = await service.findAll(2, 5);

      expect(result).toEqual({
        data: mockCustomers,
        total: totalCount,
        page: 2,
        limit: 5,
        totalPages: 3, // Math.ceil(15 / 5) = 3
      });

      // Verify the skip calculation: (page - 1) * limit = (2 - 1) * 5 = 5
      const skipCall = mockCustomerModel.find().sort().skip;
      expect(skipCall).toHaveBeenCalledWith(5);
      expect(mockCustomerModel.find().sort().skip().limit).toHaveBeenCalledWith(
        5,
      );
    });

    it('should sort customers by createdAt descending', async () => {
      mockCustomerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      mockCustomerModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await service.findAll();

      expect(mockCustomerModel.find().sort).toHaveBeenCalledWith({
        createdAt: -1,
      });
    });

    it('should handle database errors', async () => {
      const databaseError = new Error('Database error');
      mockCustomerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockRejectedValue(databaseError),
            }),
          }),
        }),
      });

      await expect(service.findAll()).rejects.toThrow(databaseError);
    });
  });

  describe('findOne', () => {
    it('should return a customer when found', async () => {
      const customerId = '507f1f77bcf86cd799439011';

      mockCustomerModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCustomer),
      });

      const result = await service.findOne(customerId);

      expect(result).toEqual(mockCustomer);
      expect(mockCustomerModel.findById).toHaveBeenCalledWith(customerId);
    });

    it('should throw NotFoundException when customer not found', async () => {
      const customerId = 'nonexistent-id';

      mockCustomerModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(customerId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(customerId)).rejects.toThrow(
        `Customer with ID ${customerId} not found`,
      );

      expect(mockCustomerModel.findById).toHaveBeenCalledWith(customerId);
    });

    it('should handle database errors', async () => {
      const customerId = '507f1f77bcf86cd799439011';
      const databaseError = new Error('Database error');

      mockCustomerModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(databaseError),
      });

      await expect(service.findOne(customerId)).rejects.toThrow(databaseError);
    });

    it('should handle invalid ObjectId format', async () => {
      const invalidId = 'invalid-id';

      // Mongoose will handle invalid ObjectIds and return null
      mockCustomerModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(invalidId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateCustomerUniqueness', () => {
    it('should not throw when email and phone are unique', async () => {
      mockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service['validateCustomerUniqueness'](
          'unique@example.com',
          '+1234567890',
        ),
      ).resolves.not.toThrow();

      expect(mockCustomerModel.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'unique@example.com' }, { phone: '+1234567890' }],
      });
    });

    it('should throw when email already exists', async () => {
      const existingCustomer = {
        ...mockCustomer,
        email: 'existing@example.com',
      };

      mockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCustomer),
      });

      await expect(
        service['validateCustomerUniqueness'](
          'existing@example.com',
          '+1234567890',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw when phone already exists', async () => {
      const existingCustomer = { ...mockCustomer, phone: '+1234567890' };

      mockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingCustomer),
      });

      await expect(
        service['validateCustomerUniqueness']('new@example.com', '+1234567890'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
