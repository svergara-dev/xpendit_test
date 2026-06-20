import { IsString, IsNumber, IsPositive, IsISO8601 } from 'class-validator';

export class CreateGastoDto {
  @IsString()
  id: string;

  @IsNumber()
  @IsPositive()
  monto: number;

  @IsString()
  moneda: string;

  @IsISO8601()
  fecha: string;

  @IsString()
  categoria: string;

  @IsString()
  empleado_id: string;
}
