import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OperationHistoryEntry } from '../types/operation-history.types';

@Entity('accounts')
export class Account {
  @ApiProperty({ description: 'Unique identifier of the account' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the user' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Map of panel IDs to their respective user IDs' })
  @Column('jsonb')
  panelAccounts: {
    [panelId: string]: {
      userId: string;
      panelName: string;
    };
  };

  @ApiProperty({ description: 'Current usage in GB' })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  current_usage: number;

  @ApiProperty({ description: 'Usage limit in GB' })
  @Column('decimal', { precision: 10, scale: 2 })
  usage_limit: number;

  @ApiProperty({ description: 'Whether the account is enabled' })
  @Column()
  enable: boolean;

  @ApiProperty({ description: 'Package duration in days' })
  @Column()
  package_days: number;

  @ApiProperty({ description: 'Start date of the account' })
  @CreateDateColumn()
  start_date: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({ description: 'History of operations on this account' })
  @Column('jsonb', { default: [] })
  operationHistory: OperationHistoryEntry[];
}
