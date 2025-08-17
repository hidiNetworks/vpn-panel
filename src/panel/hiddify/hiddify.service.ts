/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

/**
 * API Response Types
 */
export interface SuccessResponse {
  msg: string;
  status: number;
}

export interface MessageResponse {
  msg: string;
}

export interface PanelInfo {
  version: string;
}

export interface UserProfile {
  profile_title: string;
  usage_limit_GB: number;
  profile_remaining_days: number;
  profile_usage_current: number;
  profile_usage_total: number;
  telegram_id?: number;
  profile_url?: string;
  brand_title?: string;
  brand_icon_url?: string;
}

export interface UserConfig {
  name: string;
  type: string;
  link: string;
  domain?: string;
  protocol?: string;
  transport?: string;
  security?: string;
}

export interface UserApp {
  title: string;
  url: string;
  type?: string;
  description?: string;
  icon_url?: string;
}

export interface MTProxy {
  title: string;
  link: string;
}

export interface ShortUrl {
  short: string;
  full_url: string;
  expire_in: number;
}

export interface HiddifyConfig {
  baseUrl: string;
  proxyPath: string;
  apiKey: string;
}

/**
 * Response type for panel information endpoint
 * Contains basic information about the panel version
 */
export interface PanelInfo {
  version: string;
}

/**
 * Represents a user in the Hiddify system
 * Based on the OpenAPI specification from document.json
 */
export interface User {
  uuid: string;
  name: string;
  enable: boolean;
  is_active: boolean;
  mode?: 'no_reset' | 'monthly' | 'weekly' | 'daily';
  usage_limit_GB?: number;
  package_days?: number;
  current_usage_GB?: number;
  last_reset_time?: string;
  telegram_id?: number;
  comment?: string;
}

/**
 * Represents an admin user in the Hiddify system
 * Based on the OpenAPI specification from document.json
 */
export interface Admin {
  uuid?: string;
  name: string;
  mode: 'super_admin' | 'admin' | 'agent';
  can_add_admin: boolean;
  lang: 'en' | 'fa' | 'ru' | 'pt' | 'zh';
  max_users?: number;
  max_active_users?: number;
  telegram_id?: number;
  comment?: string;
}

/**
 * Response type for server status endpoint
 * Contains system statistics and usage history
 */
export interface ServerStatus {
  stats: Record<string, unknown>;
  usage_history: Record<string, unknown>;
}

/**
 * Service for interacting with Hiddify Panel API
 * This service can be instantiated multiple times with different configurations
 * to manage multiple Hiddify panels simultaneously
 *
 * Example usage:
 * ```typescript
 * // Create a new instance with panel details
 * const panel1 = HiddifyService.create(
 *   'https://panel1.example.com',
 *   'proxy1',
 *   'apiKey1'
 * );
 *
 * // Create another instance for a different panel
 * const panel2 = HiddifyService.create(
 *   'https://panel2.example.com',
 *   'proxy2',
 *   'apiKey2'
 * );
 *
 * // Example with data from database
 * const panelData = await database.getPanelConfig();
 * const panel = HiddifyService.create(
 *   panelData.baseUrl,
 *   panelData.proxyPath,
 *   panelData.apiKey
 * );
 * ```
 */

// User related interfaces will be defined after the class

// Decorator to mark this class as injectable for NestJS dependency injection
export class HiddifyService {
  // Instance of axios HTTP client with custom configuration
  private axiosInstance: ReturnType<typeof axios.create>;
  // Service configuration object containing connection details

  /**
   * Creates a new instance of HiddifyService
   * @param baseUrl The base URL of the Hiddify panel
   * @param proxyPath The proxy path for the panel
   * @param apiKey The API key for authentication
   * @returns A new instance of HiddifyService
   * @throws Error if any required parameters are missing
   */

  /**
   * Constructor for HiddifyService
   * Note: While public for DI compatibility, prefer using HiddifyService.create() for manual instantiation
   */
  private constructor(private readonly config: HiddifyConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: { 'Hiddify-API-Key': config.apiKey },
      validateStatus: (status) => status >= 200 && status < 300,
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data && error.response?.status) {
          throw new HttpException(
            error.response.data as string | Record<string, unknown>,
            error.response.status,
          );
        }
        throw new HttpException(
          'Failed to connect to Hiddify panel',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      },
    );
  }
  static create(config: HiddifyConfig): HiddifyService {
    return new HiddifyService(config);
  }

  /**
   * Get panel information including version
   * @returns Panel information including version
   */
  // Fetch panel information including version
  // Returns: Promise that resolves to PanelInfo object
  async getPanelInfo(): Promise<PanelInfo> {
    if (!this.config) {
      throw new Error('Hiddify config is not set!');
    }
    // Make GET request to panel info endpoint
    const { data } = await this.axiosInstance.get<PanelInfo>(
      `/${this.config.proxyPath}/api/v2/panel/info/`,
    );
    // Return only the data portion of the response
    return data;
  }

  // Get a list of all users in the system
  // Returns: Promise that resolves to an array of User objects
  async getAllUsers(): Promise<User[]> {
    // Make GET request to users endpoint
    const { data } = await this.axiosInstance.get<User[]>(
      `/${this.config.proxyPath}/api/v2/admin/user/`,
    );
    // Return the array of users
    return data;
  }

  // Get details for a specific user by their UUID
  // Parameters:
  //   uuid: string - The unique identifier of the user
  // Returns: Promise that resolves to a User object
  async getUser(uuid: string): Promise<User> {
    // Make GET request to specific user endpoint
    const { data } = await this.axiosInstance.get<User>(
      `/${this.config.proxyPath}/api/v2/admin/user/${uuid}/`,
    );
    // Return the user data
    return data;
  }

  /**
   * Create a new user
   * @param userData User creation data
   * @returns Created user details
   */
  // Create a new user in the system
  // Parameters:
  //   userData: User object without UUID (system will generate it)
  // Returns: Promise that resolves to the created User object
  async createUser(userData: Omit<User, 'uuid'>): Promise<User> {
    // Make POST request to create user
    const { data } = await this.axiosInstance.post<User>(
      `/${this.config.proxyPath}/api/v2/admin/user/`,
      userData,
    );
    // Return the created user data
    return data;
  }

  // Update an existing user's information
  // Parameters:
  //   uuid: string - The unique identifier of the user to update
  //   userData: Partial<User> - Only the fields that need to be updated
  // Returns: Promise that resolves to the updated User object
  async updateUser(uuid: string, userData: Partial<User>): Promise<User> {
    // Make PATCH request to update user
    const { data } = await this.axiosInstance.patch<User>(
      `/${this.config.proxyPath}/api/v2/admin/user/${uuid}/`,
      userData,
    );
    // Return the updated user data
    return data;
  }

  // Delete a user from the system
  // Parameters:
  //   uuid: string - The unique identifier of the user to delete
  // Returns: Promise that resolves to a SuccessResponse
  async deleteUser(uuid: string): Promise<SuccessResponse> {
    // Make DELETE request to remove user
    const { data } = await this.axiosInstance.delete<SuccessResponse>(
      `/${this.config.proxyPath}/api/v2/admin/user/${uuid}/`,
    );
    // Return the success response
    return data;
  }

  /**
   * Get list of all admins
   * @returns Array of admins
   */
  // Get a list of all administrators in the system
  // Returns: Promise that resolves to an array of Admin objects
  async getAllAdmins(): Promise<Admin[]> {
    // Make GET request to fetch all admins
    const { data } = await this.axiosInstance.get<Admin[]>(
      `/${this.config.proxyPath}/api/v2/admin/admin_user/`,
    );
    // Return the array of admins
    return data;
  }

  // Get details for a specific administrator
  // Parameters:
  //   uuid: string - The unique identifier of the admin
  // Returns: Promise that resolves to an Admin object
  async getAdmin(uuid: string): Promise<Admin> {
    // Make GET request to fetch specific admin
    const { data } = await this.axiosInstance.get<Admin>(
      `/${this.config.proxyPath}/api/v2/admin/admin_user/${uuid}/`,
    );
    // Return the admin data
    return data;
  }

  // Create a new administrator in the system
  // Parameters:
  //   adminData: Admin object without UUID (system will generate it)
  // Returns: Promise that resolves to the created Admin object
  async createAdmin(adminData: Omit<Admin, 'uuid'>): Promise<Admin> {
    // Make POST request to create admin
    const { data } = await this.axiosInstance.post<Admin>(
      `/${this.config.proxyPath}/api/v2/admin/admin_user/`,
      adminData,
    );
    // Return the created admin data
    return data;
  }

  // Update an existing administrator's information
  // Parameters:
  //   uuid: string - The unique identifier of the admin to update
  //   adminData: Partial<Admin> - Only the fields that need to be updated
  // Returns: Promise that resolves to the updated Admin object
  async updateAdmin(uuid: string, adminData: Partial<Admin>): Promise<Admin> {
    // Make PATCH request to update admin
    const { data } = await this.axiosInstance.patch<Admin>(
      `/${this.config.proxyPath}/api/v2/admin/admin_user/${uuid}/`,
      adminData,
    );
    // Return the updated admin data
    return data;
  }

  // Delete an administrator from the system
  // Parameters:
  //   uuid: string - The unique identifier of the admin to delete
  // Returns: Promise that resolves to a SuccessResponse
  async deleteAdmin(uuid: string): Promise<SuccessResponse> {
    // Make DELETE request to remove admin
    const { data } = await this.axiosInstance.delete<SuccessResponse>(
      `/${this.config.proxyPath}/api/v2/admin/admin_user/${uuid}/`,
    );
    // Return the success response
    return data;
  }

  /**
   * Get server status including stats and usage history
   * @returns Server status information
   */
  // Get current server status including stats and usage history
  // Returns: Promise that resolves to a ServerStatus object
  async getServerStatus(): Promise<ServerStatus> {
    // Make GET request to fetch server status
    const { data } = await this.axiosInstance.get<ServerStatus>(
      `/${this.config.proxyPath}/api/v2/admin/server_status/`,
    );
    // Return the server status data
    return data;
  }

  // Get all system configurations
  // Returns: Promise that resolves to a record of configuration key-value pairs
  async getAllConfigs(): Promise<Record<string, unknown>> {
    // Make GET request to fetch all configurations
    const { data } = await this.axiosInstance.get<Record<string, unknown>>(
      `/${this.config.proxyPath}/api/v2/admin/all-configs/`,
    );
    // Return the configuration data
    return data;
  }

  // Update usage statistics for all users in the system
  // Returns: Promise that resolves to a MessageResponse
  async updateUserUsage(): Promise<MessageResponse> {
    // Make GET request to trigger usage update
    const { data } = await this.axiosInstance.get<MessageResponse>(
      `/${this.config.proxyPath}/api/v2/admin/update_user_usage/`,
    );
    // Return the response message
    return data;
  }

  // Get profile information for a specific user
  // Parameters:
  //   uuid: string - The unique identifier of the user
  // Returns: Promise that resolves to a UserProfile object
  async getUserProfile(uuid: string): Promise<UserProfile> {
    // Make GET request to fetch user profile
    const { data } = await this.axiosInstance.get<UserProfile>(
      `/${this.config.proxyPath}/${uuid}/api/v2/user/me/`,
    );
    // Return the user profile data
    return data;
  }

  /**
   * Get user's proxy configurations
   * @param uuid User's UUID
   * @returns Array of proxy configurations
   */
  // Get all proxy configurations for a specific user
  // Parameters:
  //   uuid: string - The unique identifier of the user
  // Returns: Promise that resolves to an array of UserConfig objects
  async getUserConfigs(uuid: string): Promise<UserConfig[]> {
    // Make GET request to fetch user configurations
    const { data } = await this.axiosInstance.get<UserConfig[]>(
      `/${this.config.proxyPath}/${uuid}/api/v2/user/all-configs/`,
    );
    // Return the configuration data
    return data;
  }

  // Get list of available applications for a user
  // Parameters:
  //   uuid: string - The unique identifier of the user
  //   platform: string - Target platform (auto, android, ios, etc.)
  // Returns: Promise that resolves to an array of UserApp objects
  async getUserApps(uuid: string, platform = 'auto'): Promise<UserApp[]> {
    // Make GET request to fetch available apps with platform filter
    const { data } = await this.axiosInstance.get<UserApp[]>(
      `/${this.config.proxyPath}/${uuid}/api/v2/user/apps/`,
      { params: { platform } },
    );
    // Return the apps data
    return data;
  }

  // Get MTProto proxy configurations for a user
  // Parameters:
  //   uuid: string - The unique identifier of the user
  // Returns: Promise that resolves to an array of MTProxy objects
  async getUserMTProxies(uuid: string): Promise<MTProxy[]> {
    // Make GET request to fetch MTProto configurations
    const { data } = await this.axiosInstance.get<MTProxy[]>(
      `/${this.config.proxyPath}/${uuid}/api/v2/user/mtproxies/`,
    );
    // Return the MTProto configuration data
    return data;
  }

  // Get a short URL for a user's configurations
  // Parameters:
  //   uuid: string - The unique identifier of the user
  // Returns: Promise that resolves to a ShortUrl object
  async getUserShortUrl(uuid: string): Promise<ShortUrl> {
    // Make GET request to generate short URL
    const { data } = await this.axiosInstance.get<ShortUrl>(
      `/${this.config.proxyPath}/${uuid}/api/v2/user/short/`,
    );
    // Return the short URL data
    return data;
  }
}
