import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PanelType {
  HIDDIFY = 'hiddify',
  MARZBAN = 'marzban',
  HYSTERIA2 = 'hysteria2',
  SSH = 'ssh',
  X_UI = '3x-ui',
}

@Entity('panels')
export class Panel {
  @ApiProperty({ description: 'Unique identifier of the panel' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Unique name of the panel' })
  @Column({ unique: true })
  name!: string;

  @ApiProperty({ description: 'Base URL of the panel' })
  @Column()
  baseUrl!: string;

  @ApiProperty({ description: 'API key for authentication' })
  @Column()
  apiKey!: string;

  @ApiPropertyOptional({ description: 'Optional proxy path' })
  @Column({ type: 'varchar', nullable: true })
  proxyPath?: string | null;

  @ApiProperty({ description: 'IP address of the panel' })
  @Column()
  ip!: string;

  @ApiProperty({ description: 'Physical location of the panel' })
  @Column()
  location!: string;

  @ApiProperty({
    description: 'Type of the panel',
    enum: PanelType,
    default: PanelType.HIDDIFY,
  })
  @Column({
    type: 'enum',
    enum: PanelType,
    default: PanelType.HIDDIFY,
  })
  type!: PanelType;

  @ApiProperty({
    description: 'Creation timestamp',
    type: 'string',
    format: 'date-time',
  })
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    type: 'string',
    format: 'date-time',
  })
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
