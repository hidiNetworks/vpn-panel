import { Module } from '@nestjs/common';
import { PanelService } from './panel.service';
import { PanelController } from './panel.controller';
import { HiddifyService } from './hiddify/hiddify.service';

@Module({
  providers: [PanelService, HiddifyService],
  controllers: [PanelController]
})
export class PanelModule {}
