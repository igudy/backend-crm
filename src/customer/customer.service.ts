import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from './entities/customer.entity';
import mongoose from 'mongoose';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: mongoose.Model<Customer>,
  ) {}
  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // validate email and phone number uniqueness
    await this.validateCustomerUniqueness(
      createCustomerDto.email,
      createCustomerDto.phone,
    );

    const newCustomer = await this.customerModel.create(createCustomerDto);

    return newCustomer;
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.customerModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments().exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  private async validateCustomerUniqueness(
    email: string,
    phone: string,
  ): Promise<void> {
    const existing = await this.customerModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existing) {
      if (existing.email === email && existing.phone === phone) {
        throw new ConflictException(
          'Customer with this email and phone number already exists.',
        );
      }
      if (existing.email === email) {
        throw new ConflictException('Customer with this email already exists.');
      }
      if (existing.phone === phone) {
        throw new ConflictException(
          'Customer with this phone number already exists.',
        );
      }
    }
  }
}
