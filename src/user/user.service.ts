import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entity/user.entity';
import mongoose, { Mongoose } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
  ) {}

  async seedUsers() {
    const defaultUsers = [
      {
        name: 'Adams Usman',
        email: 'adams@yopmail.com',
        phone: '08011111111',
        role: 'technician',
      },
      {
        name: 'Faridah Adamu',
        email: 'faridah@yopmail.com',
        phone: '08022222222',
        role: 'technician',
      },
      {
        name: 'Yakubu Usman',
        email: 'yakubu@yopmail.com',
        phone: '08033333333',
        role: 'technician',
      },
      {
        name: 'Hilary Martins',
        email: 'hilary@yopmail.com',
        phone: '08044444444',
        role: 'technician',
      },
      {
        name: 'Samuel Oguju',
        email: 'sam@yopmail.com',
        phone: '08055555555',
        role: 'technician',
      },
    ];

    const seededUsers = await this.userModel.insertMany(defaultUsers);
    return seededUsers;
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
