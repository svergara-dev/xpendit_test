import { Module } from '@nestjs/common';
import { ValidationEngineService } from './engine/validation-engine.service';

@Module({
  providers: [ValidationEngineService],
  exports: [ValidationEngineService],
})
export class PoliticasModule {}
