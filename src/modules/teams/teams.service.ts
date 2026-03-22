import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto, TeamPokemonDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTeamRules(pokemons: TeamPokemonDto[]) {
    // Regra: Máximo de 6 Pokémons
    if (pokemons.length > 6) {
      throw new BadRequestException('O limite máximo é de 6 Pokémons por time.');
    }
    
    // Regra: Evitar duplicação (Species Clause - um da mesma espécie/pokedexId por vez)
    const pokemonIds = pokemons.map(p => p.pokemonId);
    const uniqueIds = new Set(pokemonIds);
    if (uniqueIds.size !== pokemonIds.length) {
      throw new BadRequestException('Não é permitido ter Pokémons duplicados (da mesma espécie) no mesmo time (Species Clause).');
    }
  }

  async createTeam(userId: string, dto: CreateTeamDto) {
    this.validateTeamRules(dto.pokemons);

    const pokemonIds = dto.pokemons.map(p => p.pokemonId);
    const bannedCount = await this.prisma.pokemon.count({
      where: { id: { in: pokemonIds }, isBanned: true }
    });
    if (bannedCount > 0) {
      throw new BadRequestException('Um ou mais Pokémons estão banidos das regras atuais.');
    }

    return this.prisma.team.create({
      data: {
        userId,
        name: dto.name,
        isPublic: dto.isPublic ?? false,
        pokemons: {
          create: dto.pokemons.map(p => ({
            pokemonId: p.pokemonId,
            nickname: p.nickname,
            level: p.level ?? 100,
            itemId: p.itemId,
            moves: p.moves || [],
          })),
        },
      },
      include: {
        pokemons: true,
      },
    });
  }

  async getUserTeams(userId: string) {
    return this.prisma.team.findMany({
      where: { userId },
      include: {
        pokemons: { include: { pokemon: true, item: true } },
      },
    });
  }

  async getTeamById(id: string, userId?: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        pokemons: { include: { pokemon: true, item: true } },
      },
    });

    if (!team) throw new NotFoundException('Time não encontrado.');
    // Se não for público, usuário checa a posse:
    if (!team.isPublic && team.userId !== userId) {
      throw new NotFoundException('Time restrito ou privado.');
    }

    return team;
  }

  async updateTeam(id: string, userId: string, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team || team.userId !== userId) {
      throw new NotFoundException('Time não encontrado ou sem permissão para atualizar.');
    }

    if (dto.pokemons) {
      this.validateTeamRules(dto.pokemons);
    }

    if (dto.pokemons) {
      const pokemonIds = dto.pokemons.map(p => p.pokemonId);
      const bannedCount = await this.prisma.pokemon.count({
        where: { id: { in: pokemonIds }, isBanned: true }
      });
      if (bannedCount > 0) {
        throw new BadRequestException('Um ou mais Pokémons estão banidos das regras atuais.');
      }
    }

    if (dto.pokemons) {
      const pokemons = dto.pokemons;

      return this.prisma.$transaction(async (tx) => {
        await tx.teamPokemon.deleteMany({
          where: { teamId: id },
        });

        return tx.team.update({
          where: { id },
          data: {
            name: dto.name,
            isPublic: dto.isPublic,
            pokemons: {
              create: pokemons.map(p => ({
                pokemonId: p.pokemonId,
                nickname: p.nickname,
                level: p.level ?? 100,
                itemId: p.itemId,
                moves: p.moves || [],
              })),
            },
          },
          include: { pokemons: true },
        });
      });
    }

    return this.prisma.team.update({
      where: { id },
      data: {
        name: dto.name,
        isPublic: dto.isPublic,
      },
      include: { pokemons: true },
    });
  }

  async deleteTeam(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team || team.userId !== userId) {
      throw new NotFoundException('Time não encontrado ou sem permissão de dono.');
    }

    return this.prisma.team.delete({
      where: { id },
    });
  }
}
