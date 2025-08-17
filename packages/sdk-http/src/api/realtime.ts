/**
 * 实时通信 API 接口
 * 提供实时服务统计和系统广播等管理功能
 */

import { http } from '../client.js';
import type { 
  RealtimeStatsResponse, 
  BroadcastRequest, 
  BaseResponse 
} from './types.js';

/**
 * 实时通信 API 类
 * 封装实时通信管理相关的接口调用
 */
export class RealtimeAPI {
  private static readonly BASE_PATH = '/api/realtime';

  /**
   * 获取实时服务统计信息
   * @param accessToken 访问令牌（可选，有些统计可能需要权限）
   * @returns Promise<RealtimeStatsResponse> 实时服务统计
   * @throws HttpError 当获取统计失败时抛出错误
   * 
   * @example
   * ```typescript
   * const stats = await RealtimeAPI.getStats();
   * console.log('WebSocket connections:', stats.connections);
   * console.log('Active channels:', stats.channels);
   * ```
   */
  static async getStats(accessToken?: string): Promise<RealtimeStatsResponse> {
    const headers: Record<string, string> = {};
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return http.get<RealtimeStatsResponse>(`${this.BASE_PATH}/stats`, { headers });
  }

  /**
   * 发送系统广播消息（需要管理员权限）
   * @param accessToken 管理员访问令牌
   * @param request 广播请求参数
   * @returns Promise<BaseResponse> 广播结果
   * @throws HttpError 当广播失败时抛出错误
   * 
   * @example
   * ```typescript
   * const response = await RealtimeAPI.broadcast('admin_token', {
   *   level: 'info',
   *   message: '系统维护通知：服务将在10分钟后重启',
   *   targetUsers: ['user1', 'user2'] // 可选，不提供则广播给所有用户
   * });
   * 
   * console.log('Broadcast success:', response.success);
   * ```
   */
  static async broadcast(
    accessToken: string, 
    request: BroadcastRequest
  ): Promise<BaseResponse> {
    return http.post<BaseResponse>(`${this.BASE_PATH}/broadcast`, request, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  /**
   * 发送信息级别的系统广播
   * @param accessToken 管理员访问令牌
   * @param message 消息内容
   * @param targetUsers 目标用户（可选）
   * @returns Promise<BaseResponse> 广播结果
   * 
   * @example
   * ```typescript
   * const response = await RealtimeAPI.broadcastInfo(
   *   'admin_token',
   *   '新功能上线通知'
   * );
   * ```
   */
  static async broadcastInfo(
    accessToken: string,
    message: string,
    targetUsers?: string[]
  ): Promise<BaseResponse> {
    return this.broadcast(accessToken, {
      level: 'info',
      message,
      targetUsers
    });
  }

  /**
   * 发送警告级别的系统广播
   * @param accessToken 管理员访问令牌
   * @param message 消息内容
   * @param targetUsers 目标用户（可选）
   * @returns Promise<BaseResponse> 广播结果
   * 
   * @example
   * ```typescript
   * const response = await RealtimeAPI.broadcastWarning(
   *   'admin_token',
   *   '系统将在30分钟后进行维护'
   * );
   * ```
   */
  static async broadcastWarning(
    accessToken: string,
    message: string,
    targetUsers?: string[]
  ): Promise<BaseResponse> {
    return this.broadcast(accessToken, {
      level: 'warning',
      message,
      targetUsers
    });
  }

  /**
   * 发送错误级别的系统广播
   * @param accessToken 管理员访问令牌
   * @param message 消息内容
   * @param targetUsers 目标用户（可选）
   * @returns Promise<BaseResponse> 广播结果
   * 
   * @example
   * ```typescript
   * const response = await RealtimeAPI.broadcastError(
   *   'admin_token',
   *   '系统遇到严重错误，请立即保存工作'
   * );
   * ```
   */
  static async broadcastError(
    accessToken: string,
    message: string,
    targetUsers?: string[]
  ): Promise<BaseResponse> {
    return this.broadcast(accessToken, {
      level: 'error',
      message,
      targetUsers
    });
  }
}

/**
 * WebSocket 连接增强类型
 * 基于 API 文档扩展 Socket.IO 消息类型
 */
export interface SocketMessage {
  /** 消息ID */
  id: string;
  /** 消息类型 */
  type: 'event' | 'ack' | 'notification';
  /** 时间戳 */
  timestamp: number;
}

/**
 * Socket.IO 事件消息
 */
export interface SocketEventMessage extends SocketMessage {
  type: 'event';
  /** 频道名称 */
  topic: string;
  /** 消息载荷 */
  payload: any;
  /** 发送者ID */
  from: string;
  /** 序列号 */
  seq: number;
}

/**
 * Socket.IO 系统通知
 */
export interface SocketNotification extends SocketMessage {
  type: 'notification';
  /** 通知级别 */
  level: 'info' | 'warning' | 'error';
  /** 通知消息 */
  message: string;
}

/**
 * Socket.IO ACK 确认
 */
export interface SocketAck extends SocketMessage {
  type: 'ack';
  /** 原始消息ID */
  originalId: string;
  /** 状态 */
  status: 'success' | 'error';
  /** 错误信息（如果有） */
  error?: string;
}

/**
 * Socket.IO 订阅请求
 */
export interface SocketSubscribeRequest {
  /** 频道名称 */
  topic: string;
  /** 消息ID（用于ACK） */
  messageId: string;
}

/**
 * Socket.IO 取消订阅请求
 */
export interface SocketUnsubscribeRequest {
  /** 频道名称 */
  topic: string;
  /** 消息ID（用于ACK） */
  messageId: string;
}

/**
 * Socket.IO 发布请求
 */
export interface SocketPublishRequest {
  /** 频道名称 */
  topic: string;
  /** 消息载荷 */
  payload: any;
  /** 消息ID */
  messageId: string;
  /** 是否需要ACK确认 */
  ackRequired?: boolean;
}

/**
 * Socket.IO 心跳请求
 */
export interface SocketHeartbeatRequest {
  /** 时间戳 */
  timestamp: number;
}

/**
 * Socket.IO 心跳响应
 */
export interface SocketHeartbeatResponse {
  /** 时间戳 */
  timestamp: number;
}

/**
 * Socket.IO 连接确认
 */
export interface SocketConnectedData {
  /** 连接ID */
  connectionId: string;
  /** 时间戳 */
  timestamp: number;
  /** 用户信息 */
  user: {
    id: string;
    role: string;
  };
}

/**
 * Socket.IO 响应数据
 */
export interface SocketResponse {
  /** 响应状态 */
  status: 'success' | 'error';
  /** 错误信息（如果有） */
  error?: string;
  /** 响应数据（如果有） */
  data?: any;
}

/**
 * Socket.IO 客户端事件接口
 * 定义客户端可以监听的所有事件
 */
export interface SocketClientEvents {
  /** 连接成功 */
  connected: (data: SocketConnectedData) => void;
  /** 连接错误 */
  connect_error: (error: Error) => void;
  /** 断开连接 */
  disconnect: (reason: string) => void;
  /** 接收消息 */
  message: (message: SocketEventMessage) => void;
  /** 接收系统通知 */
  notification: (notification: SocketNotification) => void;
  /** 接收ACK确认 */
  ack: (ack: SocketAck) => void;
  /** 心跳确认 */
  heartbeat_ack: (response: SocketHeartbeatResponse) => void;
  /** 通用错误 */
  error: (error: any) => void;
}

/**
 * Socket.IO 服务器事件接口
 * 定义客户端可以发送的所有事件
 */
export interface SocketServerEvents {
  /** 订阅频道 */
  subscribe: (request: SocketSubscribeRequest, callback?: (response: SocketResponse) => void) => void;
  /** 取消订阅频道 */
  unsubscribe: (request: SocketUnsubscribeRequest, callback?: (response: SocketResponse) => void) => void;
  /** 发布消息 */
  publish: (request: SocketPublishRequest, callback?: (response: SocketResponse) => void) => void;
  /** 发送心跳 */
  heartbeat: (request: SocketHeartbeatRequest) => void;
}

/**
 * 频道权限检查工具
 */
export class ChannelPermissions {
  /**
   * 检查用户是否有权限访问频道
   * @param channel 频道名称
   * @param userRole 用户角色
   * @param userId 用户ID
   * @returns boolean 是否有权限
   * 
   * @example
   * ```typescript
   * const canAccess = ChannelPermissions.canAccess(
   *   'private:admin-only',
   *   'admin',
   *   'user123'
   * );
   * ```
   */
  static canAccess(channel: string, userRole: string, userId: string): boolean {
    // 公共频道：所有用户都可以访问
    if (channel.startsWith('public:')) {
      return true;
    }

    // 系统频道：所有用户都可以订阅，但不能发布
    if (channel.startsWith('system:')) {
      return true; // 订阅权限，发布权限需要额外检查
    }

    // 用户私有频道：只能访问自己的频道
    if (channel.startsWith('user:')) {
      const targetUserId = channel.substring(5); // 移除 'user:' 前缀
      return targetUserId === userId;
    }

    // 私有频道：需要特定权限
    if (channel.startsWith('private:')) {
      // 管理员可以访问所有私有频道
      if (userRole === 'admin') {
        return true;
      }
      // 其他用户需要特定权限（这里简化处理）
      return false;
    }

    // 未知频道类型，默认拒绝
    return false;
  }

  /**
   * 检查用户是否有权限发布到频道
   * @param channel 频道名称
   * @param userRole 用户角色
   * @param userId 用户ID
   * @returns boolean 是否有发布权限
   * 
   * @example
   * ```typescript
   * const canPublish = ChannelPermissions.canPublish(
   *   'system:notifications',
   *   'user',
   *   'user123'
   * );
   * // false - 普通用户不能发布到系统频道
   * ```
   */
  static canPublish(channel: string, userRole: string, userId: string): boolean {
    // 首先检查是否有访问权限
    if (!this.canAccess(channel, userRole, userId)) {
      return false;
    }

    // 系统频道：只有管理员可以发布
    if (channel.startsWith('system:')) {
      return userRole === 'admin';
    }

    // 其他有访问权限的频道都可以发布
    return true;
  }

  /**
   * 获取用户可访问的频道列表
   * @param userRole 用户角色
   * @param userId 用户ID
   * @returns string[] 可访问的频道模式列表
   * 
   * @example
   * ```typescript
   * const channels = ChannelPermissions.getAccessibleChannels('user', 'user123');
   * // ['public:*', 'user:user123', 'system:*']
   * ```
   */
  static getAccessibleChannels(userRole: string, userId: string): string[] {
    const channels: string[] = [
      'public:*',        // 所有公共频道
      `user:${userId}`,  // 用户私有频道
      'system:*'         // 系统频道（只能订阅）
    ];

    // 管理员可以访问所有频道
    if (userRole === 'admin') {
      channels.push('private:*');
    }

    return channels;
  }
}

// 默认导出
export default RealtimeAPI;
