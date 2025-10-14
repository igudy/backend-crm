import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { JOB_STATUS } from '../entities/job.entity';

export class CreateJobDto {
  @ApiProperty({
    description: 'The ID of the customer associated with this job',
    example: '652b9e7cf2d7b12468d3a7f9',
  })
  @IsMongoId()
  @IsNotEmpty()
  customer: string;

  @ApiProperty({
    description: 'The title or name of the job',
    example: 'Air Conditioner Maintenance',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the job',
    example: 'Routine maintenance for split AC unit in the main office.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
