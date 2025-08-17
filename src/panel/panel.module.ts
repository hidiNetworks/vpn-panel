import { Module } from '@nestjs/common';
import { PanelService } from './panel.service';
import { PanelController } from './panel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Panel } from './entities/panel.entity';

@Module({
  providers: [PanelService],
  imports: [TypeOrmModule.forFeature([Panel])],
  controllers: [PanelController],
  exports: [PanelService],
})
export class PanelModule {}
