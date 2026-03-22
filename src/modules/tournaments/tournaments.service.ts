import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RegisterTournamentDto } from './dto/register-tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTournament(dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        title: dto.title,
        description: dto.description,
        format: dto.format,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      }
    });
  }

  async registerPlayer(tournamentId: string, dto: RegisterTournamentDto) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Torneio não encontrado.');
    if (tournament.status !== 'DRAFT' && tournament.status !== 'REGISTRATION') {
      throw new BadRequestException('A fase de inscrição deste torneio já foi encerrada.');
    }

    // Checa autenticidade e posse do time
    const team = await this.prisma.team.findUnique({ where: { id: dto.activeTeamId } });
    if (!team || team.userId !== dto.userId) {
      throw new BadRequestException('Este time não foi encontrado, ou não pertence a este usuário.');
    }

    // O relacionamento unique no Schema Prisma protege via banco, 
    // mas prevenimos de forma customizada com msg:
    const isAlreadyRegistered = await this.prisma.tournamentParticipant.findUnique({
      where: { tournamentId_userId: { tournamentId, userId: dto.userId } }
    });
    
    if (isAlreadyRegistered) {
      throw new BadRequestException('Este usuário já se inscreveu neste torneio.');
    }

    return this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId: dto.userId,
        activeTeamId: dto.activeTeamId,
      }
    });
  }

  async generateBrackets(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true }
    });

    if (!tournament) throw new NotFoundException('Torneio referenciado é ausente.');
    if (tournament.status !== 'DRAFT' && tournament.status !== 'REGISTRATION') {
      throw new BadRequestException('Chaveamento não pode ser re-gerado após torneio iniciar.');
    }

    const participants = tournament.participants;
    if (participants.length < 2) {
      throw new BadRequestException('Participantes insuficientes, chame mais jogadores.');
    }

    // Shuffle dos inscritos
    const shuffled = participants.sort(() => 0.5 - Math.random());
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Muda status do Torneio
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: 'IN_PROGRESS' }
      });

      // 2. Pairings de Eliminatória Simples
      const battles = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        const player1 = shuffled[i];
        const player2 = shuffled[i + 1];

        if (player2) {
          battles.push(tx.battle.create({
            data: {
              tournamentId,
              player1Id: player1.userId,
              player2Id: player2.userId,
              status: 'PENDING',
              roundInfo: 'Round 1',
            }
          }));
        } else {
          // Caso número ímpar de participantes: Dá win automático para compor a próxima fase (Bye)
          battles.push(tx.battle.create({
            data: {
              tournamentId,
              player1Id: player1.userId,
              player2Id: player1.userId, 
              winnerId: player1.userId, // Win automático (BYE)
              status: 'COMPLETED',
              roundInfo: 'Round 1 (BYE)',
            }
          }));
        }
      }

      await Promise.all(battles);
      return { message: 'Chaveamento gerado! O Torneio está Iniciado.', totalMatches: battles.length };
    });
  }

  async getTournamentDetails(id: string) {
     return this.prisma.tournament.findUnique({
       where: { id },
       include: { 
         participants: { include: { user: { include: { profile: true } } } },
         battles: true 
       }
     });
  }
}
