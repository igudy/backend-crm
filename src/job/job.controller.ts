import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JOB_STATUS } from './entities/job.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateInvoiceDto } from 'src/invoice/dto/create-invoice.dto';
import { Response } from 'express';

@ApiTags('Jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiBody({ type: CreateJobDto })
  async create(@Body() createJobDto: CreateJobDto, @Res() res: Response) {
    const result = await this.jobService.create(createJobDto);
    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: result,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Fetch all jobs with pagination and optional status filter',
  })
  @ApiQuery({ name: 'status', required: false, enum: JOB_STATUS })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findAll(
    @Res() res: Response,
    @Query('status') status?: JOB_STATUS,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const results = await this.jobService.findAll(status, +page, +limit);
    return res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully',
      ...results,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single job by ID' })
  @ApiParam({ name: 'id', example: '671f12e89e7cba7c1f3e9a3b' })
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const result = await this.jobService.findOne(id);
    return res.status(200).json({
      success: true,
      message: 'Job retrieved successfully',
      data: result,
    });
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Update job status (e.g. SCHEDULED → IN_PROGRESS, IN_PROGRESS → DONE)',
  })
  @ApiParam({ name: 'id', example: '671f12e89e7cba7c1f3e9a3b' })
  @ApiQuery({ name: 'status', enum: JOB_STATUS, required: true })
  async updateStatus(
    @Param('id') id: string,
    @Query('status') status: JOB_STATUS,
    @Res() res: Response,
  ) {
    const result = await this.jobService.updateStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'Job status updated successfully',
      data: result,
    });
  }

  @Post(':id/schedule-appointment')
  @ApiOperation({
    summary: 'Schedule an appointment for a job (only for NEW jobs)',
  })
  @ApiBody({ type: CreateAppointmentDto })
  async scheduleAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Param('id') jobId: string,
    @Res() res: Response,
  ) {
    const result = await this.jobService.scheduleAppointment(
      jobId,
      createAppointmentDto,
    );
    return res.status(201).json({
      success: true,
      message: `appointment scheduled for job with id: ${jobId}`,
      data: result,
    });
  }

  @Post(':jobId/invoice')
  @ApiOperation({
    summary: 'Create an invoice for a completed job (status must be DONE)',
  })
  @ApiParam({ name: 'jobId', example: '671f12e89e7cba7c1f3e9a3b' })
  @ApiBody({ type: CreateInvoiceDto })
  async createInvoice(
    @Param('jobId') jobId: string,
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Res() res: Response,
  ) {
    const result = await this.jobService.createInvoice(jobId, createInvoiceDto)
    return res.status(201).json({
      success: true,
      message: `Invoice generated for job with id: ${jobId}`,
      data: result,
    });
  }
}
