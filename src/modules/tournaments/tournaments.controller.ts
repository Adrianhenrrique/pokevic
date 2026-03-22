import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RegisterTournamentDto } from './dto/register-tournament.dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  create(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentsService.createTournament(createTournamentDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.getTournamentDetails(id);
  }

  @Post(':id/register')
  register(
    @Param('id') id: string, 
    @Body() registerDto: RegisterTournamentDto
  ) {
    return this.tournamentsService.registerPlayer(id, registerDto);
  }

  @Post(':id/generate-brackets')
  generateBrackets(@Param('id') id: string) {
    return this.tournamentsService.generateBrackets(id);
  }
}
