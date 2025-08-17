import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'Unique identifier of the user' })
  uuid!: string;

  @ApiProperty({ description: 'Name of the user' })
  name!: string;

  @ApiProperty({ description: 'Whether the user is enabled' })
  enable!: boolean;

  @ApiProperty({ description: 'Whether the user is active' })
  is_active!: boolean;

  @ApiPropertyOptional({ description: 'User reset mode' })
  mode?: 'no_reset' | 'monthly' | 'weekly' | 'daily';

  @ApiPropertyOptional({ description: 'Usage limit in GB' })
  usage_limit_GB?: number;

  @ApiPropertyOptional({ description: 'Package duration in days' })
  package_days?: number;

  @ApiPropertyOptional({ description: 'Current usage in GB' })
  current_usage_GB?: number;

  @ApiPropertyOptional({ description: 'Last reset time' })
  last_reset_time?: string;

  @ApiPropertyOptional({ description: 'Telegram user ID' })
  telegram_id?: number;

  @ApiPropertyOptional({ description: 'Additional comments' })
  comment?: string;
}
