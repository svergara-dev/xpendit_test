import { Module } from '@nestjs/common';
import { ValidationEngineService } from './engine/validation-engine.service';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';

@Module({
  imports: [ExchangeRateModule],
  providers: [ValidationEngineService],
  exports: [ValidationEngineService],
})
export class PoliticasModule {}
