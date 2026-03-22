import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  format!: string; // Ex: 'SINGLE_ELIMINATION'

  @IsDateString()
  startDate!: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
