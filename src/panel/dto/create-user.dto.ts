import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum UserMode {
  NO_RESET = 'no_reset',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily',
}

export class CreateUserDto {
  @ApiProperty({ description: 'Name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Whether the user is enabled' })
  @IsBoolean()
  enable: boolean;

  @ApiProperty({ description: 'Whether the user is active' })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({
    description: 'User reset mode',
    enum: UserMode,
    default: UserMode.NO_RESET,
  })
  @IsEnum(UserMode)
  mode: UserMode;

  @ApiProperty({ description: 'Usage limit in GB' })
  @IsNumber()
  @Type(() => Number)
  usage_limit_GB: number;

  @ApiProperty({ description: 'Package duration in days' })
  @IsNumber()
  @Type(() => Number)
  package_days: number;

  @ApiPropertyOptional({ description: 'Current usage in GB' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  current_usage_GB?: number;

  @ApiPropertyOptional({ description: 'Additional comments' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Array of panel IDs where the user should be created',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  panelIds: string[];
}
