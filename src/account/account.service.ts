import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './model/account.entity';
import { In, Repository } from 'typeorm';
import { User, HiddifyService } from '../panel/hiddify/hiddify.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Panel } from '../panel/entities/panel.entity';
import {
  OperationType,
  OperationStatus,
  PanelOperationResult,
  OperationHistoryEntry,
} from './types/operation-history.types';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Panel)
    private readonly panelRepository: Repository<Panel>,
  ) {}

  private addOperationHistory(
    account: Account,
    operation: OperationType,
    status: OperationStatus,
    panels: PanelOperationResult[],
  ) {
    if (!account.operationHistory) {
      account.operationHistory = [];
    }

    const historyEntry: OperationHistoryEntry = {
      operation,
      timestamp: new Date(),
      status,
      panels,
    };

    account.operationHistory.push(historyEntry);
  }

  async findAll(): Promise<Account[]> {
    return await this.accountRepository.find();
  }
  /**
   * Creates a user across all configured panels
   * @param userData The user data to create
   * @returns Promise containing an array of created users from each panel
   */
  async createUser(createUserDto: CreateUserDto): Promise<Account> {
    const createdUsers: User[] = [];
    let targetPanelIds: string[];
    const { panelIds, ...userData } = createUserDto;

    // If no panel IDs provided, get all panels
    if (!panelIds || panelIds.length === 0) {
      const allPanels = await this.panelRepository.find();
      targetPanelIds = allPanels.map((p) => p.id);
    } else {
      targetPanelIds = panelIds;
    }

    // Find all requested panels
    const panels = await this.panelRepository.find({
      where: { id: In([...targetPanelIds]) },
    });

    // Check if all panels were found
    if (panels.length !== targetPanelIds.length) {
      const foundIds = panels.map((p) => p.id);
      const missingIds = targetPanelIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Panels not found: ${missingIds.join(', ')}`);
    }
    //-------------------------------------------
    const account = this.accountRepository.create({
      name: createUserDto.name,
      start_date: new Date(),
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

    // Add operation history for successful creation
    this.addOperationHistory(
      account,
      'create',
      'success',
      panels.map((panel) => ({
        panelId: panel.id,
        panelName: panel.name,
        status: 'success' as const,
      })),
    );

    // Save the account with all panel user mappings and operation history
    try {
      await this.accountRepository.save(account);
    } catch (error) {
      console.error('Failed to save account:', error);
      throw new Error('Failed to save account to database');
    }

    return account;
  }

  /**
   * Updates a user across all configured panels where they exist
   * @param id The account ID to update
   * @param updateUserDto The user data to update
   * @returns Promise containing the updated account
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<Account> {
    // Find the account
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    // Helper function to create update object with defined values
    const getDefinedUpdates = () => {
      const updates: Partial<Account> = {};

      if (updateUserDto.name) {
        updates.name = updateUserDto.name;
      }
      if (updateUserDto.current_usage_GB !== undefined) {
        updates.current_usage = updateUserDto.current_usage_GB;
      }
      if (updateUserDto.usage_limit_GB !== undefined) {
        updates.usage_limit = updateUserDto.usage_limit_GB;
      }
      if (updateUserDto.package_days !== undefined) {
        updates.package_days = updateUserDto.package_days;
      }
      if (updateUserDto.enable !== undefined) {
        updates.enable = updateUserDto.enable;
      }

      return updates;
    };

    // Update account fields with provided values
    Object.assign(account, getDefinedUpdates());

    // Update user in each panel
    for (const [panelId, panelAccount] of Object.entries(
      account.panelAccounts,
    )) {
      try {
        // Find the panel
        const panel = await this.panelRepository.findOne({
          where: { id: panelId },
        });
        if (!panel) {
          console.warn(
            `Panel ${panelId} not found, skipping update for this panel`,
          );
          continue;
        }

        // Create a new HiddifyService instance for this operation
        await HiddifyService.create({
          baseUrl: panel.baseUrl,
          proxyPath: panel.proxyPath ?? '',
          apiKey: panel.apiKey,
        }).updateUser(panelAccount.userId, {
          name: updateUserDto.name,
          current_usage_GB: updateUserDto.current_usage_GB,
          usage_limit_GB: updateUserDto.usage_limit_GB,
          package_days: updateUserDto.package_days,
          enable: updateUserDto.enable,
        });
      } catch (error) {
        console.error(`Failed to update user in panel ${panelId}:`, error);
        // Instead of throwing, we log the error and continue with other panels
        // This ensures that a single panel failure doesn't prevent updates to other panels
        continue;
      }
    }

    // Track successful updates and errors
    const successfulUpdates: string[] = [];
    const updateErrors: Record<string, Error> = {};

    // Update user in each panel
    for (const [panelId, panelAccount] of Object.entries(
      account.panelAccounts,
    )) {
      try {
        const panel = await this.panelRepository.findOne({
          where: { id: panelId },
        });
        if (!panel) {
          updateErrors[panelId] = new Error(`Panel ${panelId} not found`);
          continue;
        }

        await HiddifyService.create({
          baseUrl: panel.baseUrl,
          proxyPath: panel.proxyPath ?? '',
          apiKey: panel.apiKey,
        }).updateUser(panelAccount.userId, {
          name: updateUserDto.name,
          current_usage_GB: updateUserDto.current_usage_GB,
          usage_limit_GB: updateUserDto.usage_limit_GB,
          package_days: updateUserDto.package_days,
          enable: updateUserDto.enable,
        });

        successfulUpdates.push(panelId);
      } catch (error) {
        updateErrors[panelId] =
          error instanceof Error ? error : new Error(String(error));
      }
    }

    // Collect update results
    const updateResults: PanelOperationResult[] = Object.entries(
      account.panelAccounts,
    ).map(([panelId, panelAccount]) => ({
      panelId,
      panelName: panelAccount.panelName,
      status: successfulUpdates.includes(panelId) ? 'success' : 'failed',
      error: updateErrors[panelId]?.message,
    }));

    // Add operation history
    this.addOperationHistory(
      account,
      'update',
      updateResults.every((r) => r.status === 'success')
        ? 'success'
        : 'partial',
      updateResults,
    );

    // Save the updated account
    try {
      await this.accountRepository.save(account);
    } catch (error) {
      console.error('Failed to save account updates:', error);
      throw new Error('Failed to save account updates');
    }

    return account;
  }

  /**
   * Deletes a user from all panels and then removes the account
   * If deletion fails in any panel, the operation is aborted
   * @param id The account ID to delete
   * @throws NotFoundException if account not found
   * @throws Error if deletion fails in any panel
   */
  async deleteAccount(id: string): Promise<void> {
    // Find the account
    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    const deletionErrors: Array<{ panelId: string; error: any }> = [];
    const successfulDeletions: string[] = [];

    // First, try to delete from all panels
    for (const [panelId, panelAccount] of Object.entries(
      account.panelAccounts,
    )) {
      try {
        // Find the panel
        const panel = await this.panelRepository.findOne({
          where: { id: panelId },
        });

        if (!panel) {
          deletionErrors.push({
            panelId,
            error: new Error(`Panel ${panelId} not found`),
          });
          continue;
        }

        // Delete user from the panel
        await HiddifyService.create({
          baseUrl: panel.baseUrl,
          proxyPath: panel.proxyPath ?? '',
          apiKey: panel.apiKey,
        }).deleteUser(panelAccount.userId);

        successfulDeletions.push(panelId);
      } catch (error) {
        deletionErrors.push({ panelId, error });
      }
    }

    // If there were any errors, update account to reflect partial deletion
    if (deletionErrors.length > 0) {
      // Log the original errors
      console.error('Deletion errors occurred:', deletionErrors);

      // Create operation history entry
      this.addOperationHistory(account, 'delete', 'partial', [
        ...successfulDeletions.map((panelId) => ({
          panelId,
          panelName: account.panelAccounts[panelId].panelName,
          status: 'success' as const,
        })),
        ...deletionErrors.map(({ panelId, error }) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            panelId,
            panelName: account.panelAccounts[panelId].panelName,
            status: 'failed' as const,
            error: errorMessage,
          };
        }),
      ]);

      // Remove successfully deleted panels from panelAccounts
      for (const panelId of successfulDeletions) {
        delete account.panelAccounts[panelId];
      }

      // Save the updated account with history and remaining panels
      await this.accountRepository.save(account);

      // Return an error indicating partial deletion
      throw new Error(
        `Partial deletion: Successfully deleted from ${successfulDeletions.length} panels, ` +
          `failed in ${deletionErrors.length} panels. Account maintained with remaining panels.`,
      );
    }

    // If we got here, all panel deletions were successful
    // Add final operation history entry before deletion
    this.addOperationHistory(
      account,
      'delete',
      'success',
      Object.entries(account.panelAccounts).map(([panelId, { panelName }]) => ({
        panelId,
        panelName,
        status: 'success' as const,
      })),
    );

    // Now we can safely delete the account from our database
    try {
      await this.accountRepository.remove(account);
    } catch (error) {
      // Log the error and update operation history
      console.error('Failed to delete account from database:', error);

      this.addOperationHistory(
        account,
        'delete',
        'failed',
        Object.entries(account.panelAccounts).map(
          ([panelId, { panelName }]) => ({
            panelId,
            panelName,
            status: 'success' as const,
            error: 'Deleted from panel but failed to delete from database',
          }),
        ),
      );

      await this.accountRepository.save(account);

      throw new Error(
        'Account was removed from all panels but failed to delete from database. ' +
          'Manual cleanup may be required.',
      );
    }
  }
}
