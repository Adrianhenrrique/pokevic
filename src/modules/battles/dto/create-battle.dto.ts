import { IsString, IsOptional } from 'class-validator';

export class CreateBattleDto {
  @IsString()
  player1Id!: string;

  @IsString()
  player2Id!: string;

  @IsString()
  @IsOptional()
  tournamentId?: string;
}
