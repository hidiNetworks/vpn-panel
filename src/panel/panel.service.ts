import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HiddifyService, User, PanelInfo } from './hiddify/hiddify.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Panel } from './entities/panel.entity';
import { Account } from './entities/account.entity';
import { CreatePanelDto } from './dto/panel.dto';
import { UpdatePanelDto } from './dto/panel.dto';

@Injectable()
export class PanelService {
  constructor(
    @InjectRepository(Panel)
    private readonly panelRepository: Repository<Panel>,
    private readonly accountRepository: Repository<Account>,
  ) {}

  /* Temporary data for development - kept for reference
  private readonly hardcodedPanels = [
    {
      name: 'bot1',
      apikey: '16544198-56f4-47f1-b281-82ad452959c8',
      baseUrl: 'https://finland-admin-sub-test.needtowork.space',
      proxyPath: 'xwjYG8FKllOPacbTZt53Tv',
    },
    {
      name: 'bot2',
      apikey: '5f8640ae-4115-4d3b-9930-329fc39c109e',
      baseUrl: 'https://finland-admin-sub-test.needtowork.space',
      proxyPath: 'xwjYG8FKllOPacbTZt53Tv',
    },
  ];
  */

  /* Example user data - kept for reference
  private readonly exampleUser: User = {
    uuid: 'string',
    name: 'string',
    enable: true,
    is_active: true,
    mode: 'no_reset',
    usage_limit_GB: 20,
    package_days: 30,
    current_usage_GB: 2,
    comment: 'userTest',
  };
  */

  // CRUD Operations
  async create(createPanelDto: CreatePanelDto): Promise<Panel> {
    const panel = this.panelRepository.create(createPanelDto);
    return await this.panelRepository.save(panel);
  }

  async findAll(): Promise<Panel[]> {
    return await this.panelRepository.find();
  }

  async findOne(id: string): Promise<Panel> {
    const panel = await this.panelRepository.findOne({ where: { id } });
    if (!panel) {
      throw new NotFoundException(`Panel with ID ${id} not found`);
    }
    return panel;
  }

  async update(id: string, updatePanelDto: UpdatePanelDto): Promise<Panel> {
    const panel = await this.findOne(id);
    Object.assign(panel, updatePanelDto);
    return await this.panelRepository.save(panel);
  }

  async remove(id: string): Promise<void> {
    const panel = await this.findOne(id);
    await this.panelRepository.remove(panel);
  }

  // Hiddify Panel Operations
  async getPanelInfo(): Promise<PanelInfo[]> {
    const panels = await this.findAll();
    const panelsData: PanelInfo[] = [];

    for (const panel of panels) {
      try {
        const panelData = await HiddifyService.create({
          baseUrl: panel.baseUrl,
          proxyPath: panel.proxyPath ?? '',
          apiKey: panel.apiKey,
        }).getPanelInfo();
        panelsData.push(panelData);
      } catch (error) {
        console.error(`Failed to get panel info for ${panel.name}:`, error);
        throw error;
      }
    }
    return panelsData;
  }

  /**
   * Creates a user across all configured panels
   * @param userData The user data to create
   * @returns Promise containing an array of created users from each panel
   */
  async createUser(createUserDto: CreateUserDto): Promise<User[]> {
    const createdUsers: User[] = [];
    const { panelIds, ...userData } = createUserDto;

    // Find all requested panels
    const panels = await this.panelRepository.findByIds(panelIds);

    // Check if all panels were found
    if (panels.length !== panelIds.length) {
      const foundIds = panels.map((p) => p.id);
      const missingIds = panelIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Panels not found: ${missingIds.join(', ')}`);
    }
    const account = this.accountRepository.create({
      name: createUserDto.name,
      start_date: Date.now(),
      current_usage: createUserDto.current_usage_GB,
      package_days: createUserDto.package_days,
      usage_limit: createUserDto.usage_limit_GB,
      enable: createUserDto.enable,
      panelAccounts: {},
    });

    for (const panel of panels) {
      try {
        // Create a new HiddifyService instance for this operation
        const createdUser = await HiddifyService.create({
          baseUrl: panel.baseUrl,
          proxyPath: panel.proxyPath ?? '',
          apiKey: panel.apiKey,
        }).createUser(userData);

        // Add the created user to the account's panelAccounts map
        account.panelAccounts[panel.id] = {
          userId: createdUser.uuid,
          panelName: panel.name,
        };

        createdUsers.push(createdUser);
      } catch (error) {
        console.error(`Failed to create user in panel ${panel.name}:`, error);
        throw error;
      }
    }

    // Save the account with all panel user mappings
    await this.accountRepository.save(account);

    return createdUsers;
  }
}
