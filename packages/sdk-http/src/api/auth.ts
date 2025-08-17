/**
 * 用户认证 API 接口
 * 提供登录、登出、令牌刷新和验证等功能
 */

import { http } from '../client.js';
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  VerifyResponse,
  LogoutRequest,
  BaseResponse,
  ErrorResponse
} from './types.js';

/**
 * 认证 API 类
 * 封装所有用户认证相关的接口调用
 */
export class AuthAPI {
  private static readonly BASE_PATH = '/v1/auth';

  /**
   * 用户登录
   * @param request 登录请求参数
   * @returns Promise<LoginResponse> 登录响应，包含访问令牌和用户信息
   * @throws HttpError 当登录失败时抛出错误
   * 
   * @example
   * ```typescript
   * const response = await AuthAPI.login({
   *   username: 'admin@example.com',
   *   password: 'password123',
   *   fingerprint: 'device_fingerprint_hash'
   * });
   * console.log('Access Token:', response.accessToken);
   * ```
   */
  static async login(request: LoginRequest): Promise<LoginResponse> {
    return http.post<LoginResponse>(`${this.BASE_PATH}/login`, request);
  }

  /**
   * 刷新访问令牌
   * @param request 刷新令牌请求参数
   * @returns Promise<RefreshResponse> 新的访问令牌信息
   * @throws HttpError 当刷新失败时抛出错误（如刷新令牌过期）
   * 
   * @example
   * ```typescript
   * const response = await AuthAPI.refresh({
   *   refreshToken: 'your_refresh_token_here'
   * });
   * console.log('New Access Token:', response.accessToken);
   * ```
   */
  static async refresh(request: RefreshRequest): Promise<RefreshResponse> {
    return http.post<RefreshResponse>(`${this.BASE_PATH}/refresh`, request);
  }

  /**
   * 验证访问令牌
   * @param accessToken 要验证的访问令牌
   * @returns Promise<VerifyResponse> 令牌验证结果和用户信息
   * @throws HttpError 当令牌无效或验证失败时抛出错误
   * 
   * @example
   * ```typescript
   * const response = await AuthAPI.verify('your_access_token');
   * if (response.valid) {
   *   console.log('User:', response.user);
   *   console.log('Permissions:', response.user.permissions);
   * }
   * ```
   */
  static async verify(accessToken: string): Promise<VerifyResponse> {
    return http.get<VerifyResponse>(`${this.BASE_PATH}/verify`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  /**
   * 用户登出
   * @param accessToken 当前访问令牌
   * @param request 登出请求参数
   * @returns Promise<BaseResponse> 登出结果
   * @throws HttpError 当登出失败时抛出错误
   * 
   * @example
   * ```typescript
   * const response = await AuthAPI.logout('access_token', {
   *   refreshToken: 'refresh_token'
   * });
   * console.log('Logout success:', response.success);
   * ```
   */
  static async logout(accessToken: string, request: LogoutRequest): Promise<BaseResponse> {
    return http.post<BaseResponse>(`${this.BASE_PATH}/logout`, request, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  /**
   * 撤销所有令牌
   * @param accessToken 当前访问令牌
   * @returns Promise<BaseResponse> 撤销结果
   * @throws HttpError 当撤销失败时抛出错误
   * 
   * @example
   * ```typescript
   * const response = await AuthAPI.revokeAll('access_token');
   * console.log('Revoke all success:', response.success);
   * ```
   */
  static async revokeAll(accessToken: string): Promise<BaseResponse> {
    return http.post<BaseResponse>(`${this.BASE_PATH}/revoke-all`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  /**
   * 获取用户会话列表
   * @param accessToken 当前访问令牌
   * @returns Promise<any> 用户会话列表
   * @throws HttpError 当获取失败时抛出错误
   * 
   * @example
   * ```typescript
   * const sessions = await AuthAPI.getSessions('access_token');
   * console.log('Active sessions:', sessions);
   * ```
   */
  static async getSessions(accessToken: string): Promise<any> {
    return http.get<any>(`${this.BASE_PATH}/sessions`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }
}

/**
 * 认证管理器
 * 提供令牌管理、自动刷新等高级功能
 */
export class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private fingerprint?: string;

  constructor(fingerprint?: string) {
    this.fingerprint = fingerprint;
  }

  /**
   * 登录并保存令牌信息
   * @param username 用户名
   * @param password 密码
   * @returns Promise<LoginResponse> 登录响应
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await AuthAPI.login({
      username,
      password,
      fingerprint: this.fingerprint
    });

    // 保存令牌信息
    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    this.tokenExpiresAt = Date.now() + (response.expiresIn * 1000);

    return response;
  }

  /**
   * 登出并清理令牌
   * @returns Promise<BaseResponse> 登出响应
   */
  async logout(): Promise<BaseResponse> {
    if (!this.accessToken || !this.refreshToken) {
      throw new Error('Not logged in');
    }

    try {
      const response = await AuthAPI.logout(this.accessToken, {
        refreshToken: this.refreshToken
      });
      
      // 清理令牌信息
      this.clearTokens();
      return response;
    } catch (error) {
      // 即使登出失败，也清理本地令牌
      this.clearTokens();
      throw error;
    }
  }

  /**
   * 获取当前访问令牌，如果即将过期则自动刷新
   * @returns Promise<string> 有效的访问令牌
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not logged in');
    }

    // 检查令牌是否即将过期（提前5分钟刷新）
    if (this.isTokenExpiringSoon(5 * 60 * 1000)) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * 刷新访问令牌
   * @returns Promise<void>
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await AuthAPI.refresh({
        refreshToken: this.refreshToken,
        fingerprint: this.fingerprint
      });

      // 更新访问令牌信息
      this.accessToken = response.accessToken;
      this.tokenExpiresAt = Date.now() + (response.expiresIn * 1000);
    } catch (error) {
      // 刷新失败，清理令牌
      this.clearTokens();
      throw error;
    }
  }

  /**
   * 验证当前令牌
   * @returns Promise<VerifyResponse> 验证结果
   */
  async verifyToken(): Promise<VerifyResponse> {
    const token = await this.getValidAccessToken();
    return AuthAPI.verify(token);
  }

  /**
   * 检查令牌是否即将过期
   * @param thresholdMs 提前多少毫秒判断为即将过期
   * @returns boolean 是否即将过期
   */
  private isTokenExpiringSoon(thresholdMs: number = 5 * 60 * 1000): boolean {
    if (!this.tokenExpiresAt) return true;
    return Date.now() + thresholdMs >= this.tokenExpiresAt;
  }

  /**
   * 清理所有令牌信息
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * 获取当前访问令牌（不会自动刷新）
   * @returns string | null 访问令牌
   */
  getCurrentAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * 检查是否已登录
   * @returns boolean 是否已登录
   */
  isLoggedIn(): boolean {
    return !!this.accessToken && !!this.refreshToken;
  }

  /**
   * 设置令牌信息（用于从存储中恢复）
   * @param accessToken 访问令牌
   * @param refreshToken 刷新令牌
   * @param expiresIn 过期时间（秒）
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = Date.now() + (expiresIn * 1000);
  }
}

// 默认导出
export default AuthAPI;
