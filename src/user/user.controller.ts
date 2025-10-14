import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Response } from 'express';

@ApiTags('Users') 
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('seed-users')
  @ApiOperation({
    summary: 'Seed default users',
    description: 'Seeds 5 default users into the system if none exist.',
  })
  @ApiResponse({ status: 201, description: 'Users seeded successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request or seeding failed.' })
  async seedUsers(@Res() res: Response) {
    const response = await this.userService.seedUsers();
    return res.status(201).json({
      success: true,
      message: 'Users seeded successfully in the system',
      data: response,
    });
  }

  @Get('all')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const users = await this.userService.findAll(Number(page), Number(limit));
    return {
      success: true,
      message: 'Users retrieved successfully',
      ...users,
    };
  }
}
