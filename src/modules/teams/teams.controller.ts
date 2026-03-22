import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('users/:userId/teams') // Nested Resources para Time do usuário
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Param('userId') userId: string, @Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.createTeam(userId, createTeamDto);
  }

  @Get()
  findAll(@Param('userId') userId: string) {
    return this.teamsService.getUserTeams(userId);
  }

  @Get(':teamId')
  findOne(@Param('userId') userId: string, @Param('teamId') teamId: string) {
    return this.teamsService.getTeamById(teamId, userId);
  }

  @Patch(':teamId')
  update(
    @Param('userId') userId: string,
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(teamId, userId, updateTeamDto);
  }

  @Delete(':teamId')
  remove(@Param('userId') userId: string, @Param('teamId') teamId: string) {
    return this.teamsService.deleteTeam(teamId, userId);
  }
}
