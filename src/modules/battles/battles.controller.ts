import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { CreateBattleDto } from './dto/create-battle.dto';
import { UpdateBattleDto } from './dto/update-battle.dto';

@Controller('battles')
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Post()
  create(@Body() createBattleDto: CreateBattleDto) {
    return this.battlesService.createCasualBattle(createBattleDto);
  }

  @Patch(':id/result')
  setWinner(@Param('id') id: string, @Body() updateDto: UpdateBattleDto) {
    return this.battlesService.setWinner(id, updateDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.battlesService.getBattleById(id);
  }

  @Get('history/:userId')
  getHistory(@Param('userId') userId: string) {
    return this.battlesService.getPlayerHistory(userId);
  }
}
