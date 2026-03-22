import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/profile')
  getProfile(@Param('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch(':id/profile')
  updateProfile(
    @Param('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }
}
