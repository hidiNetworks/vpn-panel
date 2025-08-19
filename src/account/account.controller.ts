import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Patch,
  Param,
  Get,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Account } from './model/account.entity';
import { AccountService } from './account.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Accounts')
@Controller('account')
export class AccountController {
  constructor(@Inject() private readonly accountService: AccountService) {}
  //routes
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [Account],
  })
  async findAll(): Promise<Account[]> {
    // resource filter (select)
    return await this.accountService.findAll();
  }

  @Post()
  //swagger configs
  @ApiOperation({ summary: 'Create a user in specified panels' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully in specified panels',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'One or more panels not found' })
  @HttpCode(HttpStatus.CREATED)
  //logic
  async createUser(@Body() createUserDto: CreateUserDto): Promise<Account> {
    return await this.accountService.createUser(createUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user in all associated panels' })
  @ApiResponse({
    status: 200,
    description: 'User Updated successfully in all panels',
    type: OmitType(Account, ['id']),
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'One or more panels not found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async UpdateAccount(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Account> {
    return await this.accountService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user from all associated panels' })
  @ApiResponse({
    status: 204,
    description: 'User successfully deleted from all panels and database',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Failed to delete from one or more panels, operation rolled back',
  })
  @ApiResponse({
    status: 500,
    description: 'User deleted from panels but database deletion failed',
  })
  async deleteAccount(@Param('id') id: string): Promise<void> {
    await this.accountService.deleteAccount(id);
  }
}
