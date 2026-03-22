import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado para este usuário.');
    }

    return profile;
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    // Checa a existência real do User
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário referenciado não foi encontrado na base.');
    }

    // Faz um upsert: criar perfil minimalista caso ainda não exista, atualiza se existir.
    return this.prisma.profile.upsert({
      where: { userId },
      update: {
        inGameName: data.inGameName,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
      },
      create: {
        userId,
        displayName: data.inGameName || 'Novo Treinador',
        inGameName: data.inGameName,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
      },
    });
  }
}
