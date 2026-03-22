import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { BattleStatus } from '@prisma/client';

export class UpdateBattleDto {
  @IsString()
  @IsOptional()
  winnerId?: string;

  @IsInt()
  @IsOptional()
  scoreP1?: number;

  @IsInt()
  @IsOptional()
  scoreP2?: number;

  @IsEnum(BattleStatus)
  @IsOptional()
  status?: BattleStatus;
}
