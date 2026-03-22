import { IsString } from 'class-validator';

export class RegisterTournamentDto {
  @IsString()
  userId!: string;

  @IsString()
  activeTeamId!: string;
}
