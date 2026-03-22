import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TeamPokemonDto } from './create-team.dto';

export class UpdateTeamDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsBoolean()
	@IsOptional()
	isPublic?: boolean;

	@IsArray()
	@ArrayMaxSize(6, { message: 'Um time pode ter no máximo 6 pokémons.' })
	@ValidateNested({ each: true })
	@Type(() => TeamPokemonDto)
	@IsOptional()
	pokemons?: TeamPokemonDto[];
}
