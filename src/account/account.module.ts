import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './model/account.entity';
import { Panel } from '../panel/entities/panel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Panel])],
  providers: [AccountService],
  controllers: [AccountController],
})
export class AccountModule {}
