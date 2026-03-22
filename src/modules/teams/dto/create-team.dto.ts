import { IsString, IsBoolean, IsOptional, IsArray, ArrayMaxSize, ValidateNested, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TeamPokemonDto {
  @IsString()
  pokemonId!: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  level?: number;

  @IsString()
  @IsOptional()
  itemId?: string;

  @IsArray()
  @IsOptional()
  moves?: string[];
}

export class CreateTeamDto {
  @IsString()
  name!: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsArray()
  @ArrayMaxSize(6, { message: 'Um time pode ter no máximo 6 pokémons.' })
  @ValidateNested({ each: true })
  @Type(() => TeamPokemonDto)
  pokemons!: TeamPokemonDto[];
}
