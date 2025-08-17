import { IsString, IsEnum, IsIP, IsOptional, IsUrl } from 'class-validator';
import { PanelType } from '../entities/panel.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePanelDto {
  @ApiProperty({ description: 'Unique name of the panel' })
  @IsString()
  readonly name!: string;

  @ApiProperty({
    description: 'Base URL of the panel (with http:// or https://)',
  })
  @IsUrl({
    require_tld: false, // Allow IP addresses and local domains
    require_protocol: true, // Require http:// or https://
  })
  readonly baseUrl!: string;

  @ApiProperty({ description: 'API key for panel authentication' })
  @IsString()
  readonly apiKey!: string;

  @ApiPropertyOptional({ description: 'Optional proxy path' })
  @IsOptional()
  @IsString()
  readonly proxyPath?: string;

  @ApiProperty({ description: 'IP address of the panel' })
  @IsIP()
  readonly ip!: string;

  @ApiProperty({ description: 'Physical location of the panel' })
  @IsString()
  readonly location!: string;

  @ApiProperty({ enum: PanelType, description: 'Type of the panel' })
  @IsEnum(PanelType)
  readonly type!: PanelType;
}

// UPDATE  PANEL DTO

export class UpdatePanelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
  })
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  proxyPath?: string;

  @IsOptional()
  @IsIP()
  ip?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(PanelType)
  type?: PanelType;
}
