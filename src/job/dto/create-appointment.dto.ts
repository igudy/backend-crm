import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNotEmpty } from 'class-validator';


export class CreateAppointmentDto {
  @ApiProperty({
    description: 'The ID of the technician assigned to this appointment',
    example: '671f6b4523cf1d5f62a7a3b9',
  })
  @IsNotEmpty()
  @IsMongoId()
  technician_id: string;

  @ApiProperty({
    description: 'Start date and time of the appointment (ISO 8601)',
    example: '2025-10-15T09:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({
    description:
      'End date and time of the appointment (must be after start_date)',
    example: '2025-10-15T11:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  end_date: string;
}
