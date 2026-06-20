import { IsString, IsNumber, IsObject, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class LimiteAntiguedadDto {
  @IsNumber()
  @Min(0)
  pendiente_dias: number;

  @IsNumber()
  @Min(0)
  rechazado_dias: number;
}

class LimiteCategoriaDto {
  @IsNumber()
  @Min(0)
  aprobado_hasta: number;

  @IsNumber()
  @Min(0)
  pendiente_hasta: number;
}

class ReglaCentroCostoDto {
  @IsString()
  cost_center: string;

  @IsString()
  categoria_prohibida: string;
}

export class CreatePoliticaDto {
  @IsString()
  moneda_base: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LimiteAntiguedadDto)
  limite_antiguedad: LimiteAntiguedadDto;

  @IsObject()
  limites_por_categoria: { [categoria: string]: LimiteCategoriaDto };

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReglaCentroCostoDto)
  reglas_centro_costo: ReglaCentroCostoDto[];
}
