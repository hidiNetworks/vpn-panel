import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'Name of the user', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Current usage in GB', required: false })
  @IsNumber()
  @IsOptional()
  current_usage_GB?: number;

  @ApiProperty({ description: 'Usage limit in GB', required: false })
  @IsNumber()
  @IsOptional()
  usage_limit_GB?: number;

  @ApiProperty({ description: 'Package duration in days', required: false })
  @IsNumber()
  @IsOptional()
  package_days?: number;

  @ApiProperty({
    description: 'Whether the account is enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  enable?: boolean;
}
