import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GastosModule } from './modules/gastos/gastos.module';
import { EmpleadosModule } from './modules/empleados/empleados.module';
import { PoliticasModule } from './modules/politicas/politicas.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GastosModule,
    EmpleadosModule,
    PoliticasModule,
    ExchangeRateModule,
    SharedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
