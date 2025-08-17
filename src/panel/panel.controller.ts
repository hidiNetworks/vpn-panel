import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PanelService } from './panel.service';
import { CreatePanelDto, UpdatePanelDto } from './dto/panel.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Panel } from './entities/panel.entity';
import { PanelInfo, User } from './hiddify/hiddify.service';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('panels')
@Controller('panels')
export class PanelController {
  constructor(private readonly panelService: PanelService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new panel' })
  @ApiResponse({
    status: 201,
    description: 'Panel created successfully',
    type: Panel,
  })
  async create(@Body() createPanelDto: CreatePanelDto): Promise<Panel> {
    return await this.panelService.create(createPanelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all panels' })
  @ApiResponse({
    status: 200,
    description: 'List of all panels',
    type: [Panel],
  })
  async findAll(): Promise<Panel[]> {
    return await this.panelService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a panel by id' })
  @ApiResponse({ status: 200, description: 'The found panel', type: Panel })
  @ApiResponse({ status: 404, description: 'Panel not found' })
  async findOne(@Param('id') id: string): Promise<Panel> {
    return await this.panelService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a panel' })
  @ApiResponse({
    status: 200,
    description: 'Panel updated successfully',
    type: Panel,
  })
  @ApiResponse({ status: 404, description: 'Panel not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePanelDto: UpdatePanelDto,
  ): Promise<Panel> {
    return await this.panelService.update(id, updatePanelDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a panel' })
  @ApiResponse({ status: 204, description: 'Panel deleted successfully' })
  @ApiResponse({ status: 404, description: 'Panel not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.panelService.remove(id);
  }

  @Get('info/all')
  @ApiOperation({ summary: 'Get information from all panels' })
  @ApiResponse({
    status: 200,
    description: 'Panel information retrieved successfully',
  })
  async getPanelInfo(): Promise<PanelInfo[]> {
    return await this.panelService.getPanelInfo();
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a user in specified panels' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully in specified panels',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'One or more panels not found' })
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User[]> {
    return await this.panelService.createUser(createUserDto);
  }
}
