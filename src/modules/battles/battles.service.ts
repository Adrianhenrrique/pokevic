import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBattleDto } from './dto/create-battle.dto';
import { UpdateBattleDto } from './dto/update-battle.dto';

@Injectable()
export class BattlesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCasualBattle(dto: CreateBattleDto) {
    if (dto.player1Id === dto.player2Id) {
      throw new BadRequestException('Um jogador não pode batalhar contra sim mesmo.');
    }

    // Registra batalha amigável ou reportada manualmente
    return this.prisma.battle.create({
      data: {
        player1Id: dto.player1Id,
        player2Id: dto.player2Id,
        tournamentId: dto.tournamentId || null,
        status: 'PENDING',
        roundInfo: dto.tournamentId ? undefined : 'Amistoso',
      }
    });
  }

  async setWinner(id: string, dto: UpdateBattleDto) {
    const battle = await this.prisma.battle.findUnique({ where: { id } });
    if (!battle) throw new NotFoundException('Battle record not found.');

    if (dto.winnerId && dto.winnerId !== battle.player1Id && dto.winnerId !== battle.player2Id) {
       throw new BadRequestException('O vencedor informado deve ser um dos dois participantes originais.');
    }

    // Gerencia o Cálculo de ELO via Transação se houver um Vencedor Decidido Pela Primeira Vez
    if (dto.winnerId && !battle.winnerId) {
      const loserId = dto.winnerId === battle.player1Id ? battle.player2Id : battle.player1Id;

      return this.prisma.$transaction(async (tx) => {
         await tx.profile.update({
           where: { userId: dto.winnerId! },
           data: { elo: { increment: 25 } }
         });
         await tx.profile.update({
           where: { userId: loserId },
           data: { elo: { decrement: 25 } }
         });

         return tx.battle.update({
           where: { id },
           data: {
             winnerId: dto.winnerId,
             scoreP1: dto.scoreP1,
             scoreP2: dto.scoreP2,
             status: dto.status || 'COMPLETED',
           }
         });
      });
    }

    return this.prisma.battle.update({
      where: { id },
      data: {
        winnerId: dto.winnerId,
        scoreP1: dto.scoreP1,
        scoreP2: dto.scoreP2,
        status: dto.status || (dto.winnerId ? 'COMPLETED' : battle.status),
      }
    });
  }

  async getPlayerHistory(userId: string) {
     return this.prisma.battle.findMany({
       where: {
         OR: [
           { player1Id: userId },
           { player2Id: userId }
         ]
       },
       orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
       include: {
         tournament: { select: { title: true } }
       }
     });
  }

  async getBattleById(id: string) {
     const battle = await this.prisma.battle.findUnique({
       where: { id },
       include: { tournament: true }
     });
     if (!battle) throw new NotFoundException('Batalha não encontrada.');
     return battle;
  }
}
