import { SessionIdArg } from 'convex-helpers/server/sessions';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { getAuthUser } from '../modules/auth/getAuthUser';
import { getAuthUserSafe } from '../modules/auth/getAuthUserSafe';
import { authError } from '../modules/auth/types/AuthError';
import type { ChatResult } from '../modules/chat/types/ChatResult';
import { type Result, success } from '../modules/common/types/Result';
import { mutation, query } from './_generated/server';

// Create a new chat session
export const createChat = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    const chatId = await ctx.db.insert('chats', {
      createdAt: now,
      updatedAt: now,
      userId: user._id,
      isDeleted: false,
      messageCount: 0,
    });

    return chatId;
  },
});

// Get all messages for a chat
export const getChatMessages = query({
  args: {
    chatId: v.id('chats'),
    ...SessionIdArg,
  },
  handler: async (
    ctx,
    args
  ): Promise<
    ChatResult<
      Array<{
        _id: string;
        chatId: string;
        content: string;
        role: 'user' | 'assistant';
        timestamp: number;
        isStreaming?: boolean;
      }>
    >
  > => {
    // Get authenticated user safely
    const userResult = await getAuthUserSafe(ctx, args);
    if (!userResult.success) {
      return authError(userResult.error);
    }

    // Verify the chat belongs to the authenticated user
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return authError('chat_not_found');
    }

    if (chat.userId !== userResult.data._id) {
      return authError('unauthorized');
    }

    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .order('asc')
      .collect();

    return success(messages);
  },
});

// Send a message and get auto-response
export const sendMessage = mutation({
  args: {
    chatId: v.id('chats'),
    content: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    // Verify the chat belongs to the authenticated user
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.userId !== user._id) {
      throw new Error('Unauthorized: Chat does not belong to user');
    }

    // Add user message
    await ctx.db.insert('chatMessages', {
      chatId: args.chatId,
      content: args.content,
      role: 'user',
      timestamp: now,
    });

    // Update chat's updatedAt timestamp and increment message count
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
      messageCount: chat.messageCount + 1,
    });

    return { success: true };
  },
});

// Get the latest chat for the current user/session
export const getLatestChat = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (
    ctx,
    args
  ): Promise<
    ChatResult<{
      _id: string;
      createdAt: number;
      updatedAt: number;
      userId: string;
    } | null>
  > => {
    // Get authenticated user safely
    const userResult = await getAuthUserSafe(ctx, args);
    if (!userResult.success) {
      return authError(userResult.error);
    }

    // Find the latest active (non-deleted) chat for this user
    const chats = await ctx.db
      .query('chats')
      .withIndex('by_user_active', (q) =>
        q.eq('userId', userResult.data._id).eq('isDeleted', false)
      )
      .order('desc')
      .take(1);

    return success(chats[0] || null);
  },
});

// Get paginated chat history for the current user/session
export const getChatHistory = query({
  args: {
    ...SessionIdArg,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    args
  ): Promise<
    ChatResult<{
      page: Array<{
        _id: string;
        createdAt: number;
        updatedAt: number;
        userId: string;
        summary: string;
        messageCount: number;
      }>;
      isDone: boolean;
      continueCursor: string;
    }>
  > => {
    // Get authenticated user safely
    const userResult = await getAuthUserSafe(ctx, args);
    if (!userResult.success) {
      return authError(userResult.error);
    }

    // Query chats with pagination
    const result = await ctx.db
      .query('chats')
      .withIndex('by_user_active', (q) =>
        q.eq('userId', userResult.data._id).eq('isDeleted', false)
      )
      .order('desc')
      .paginate(args.paginationOpts);

    // Get first message for each chat to create summaries
    const chatsWithSummary = await Promise.all(
      result.page.map(async (chat) => {
        const firstMessage = await ctx.db
          .query('chatMessages')
          .withIndex('by_chat', (q) => q.eq('chatId', chat._id))
          .order('asc')
          .first();

        return {
          ...chat,
          summary: firstMessage?.content || 'New chat',
          messageCount: chat.messageCount,
        };
      })
    );

    return success({
      ...result,
      page: chatsWithSummary,
    });
  },
});

// Get chat summary (first message and metadata)
export const getChatSummary = query({
  args: {
    chatId: v.id('chats'),
    ...SessionIdArg,
  },
  handler: async (
    ctx,
    args
  ): Promise<
    ChatResult<{
      _id: string;
      createdAt: number;
      updatedAt: number;
      userId: string;
      summary: string;
      messageCount: number;
      firstMessage?: {
        _id: string;
        content: string;
        role: 'user' | 'assistant';
        timestamp: number;
      };
    } | null>
  > => {
    // Get authenticated user safely
    const userResult = await getAuthUserSafe(ctx, args);
    if (!userResult.success) {
      return authError(userResult.error);
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return success(null);
    }

    // Verify the chat belongs to the authenticated user
    if (chat.userId !== userResult.data._id) {
      return authError('unauthorized');
    }

    const firstMessage = await ctx.db
      .query('chatMessages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .order('asc')
      .first();

    return success({
      _id: chat._id,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      userId: chat.userId,
      summary: firstMessage?.content || 'New chat',
      messageCount: chat.messageCount,
      firstMessage: firstMessage
        ? {
            _id: firstMessage._id,
            content: firstMessage.content,
            role: firstMessage.role,
            timestamp: firstMessage.timestamp,
          }
        : undefined,
    });
  },
});

// Create initial streaming message for assistant
export const createStreamingMessage = mutation({
  args: {
    chatId: v.id('chats'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    // Verify the chat belongs to the authenticated user
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.userId !== user._id) {
      throw new Error('Unauthorized: Chat does not belong to user');
    }

    // Create initial streaming message
    const messageId = await ctx.db.insert('chatMessages', {
      chatId: args.chatId,
      content: '',
      role: 'assistant',
      timestamp: now,
      isStreaming: true,
    });

    // Increment message count for the new streaming message
    await ctx.db.patch(args.chatId, {
      messageCount: chat.messageCount + 1,
    });

    return messageId;
  },
});

// Update streaming message content
export const updateStreamingMessage = mutation({
  args: {
    messageId: v.id('chatMessages'),
    content: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    // Get the message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify the chat belongs to the authenticated user
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== user._id) {
      throw new Error('Unauthorized: Message does not belong to user');
    }

    // Update message content
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });

    return { success: true };
  },
});

// Finalize streaming message
export const finalizeStreamingMessage = mutation({
  args: {
    messageId: v.id('chatMessages'),
    finalContent: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    // Get the message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify the chat belongs to the authenticated user
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== user._id) {
      throw new Error('Unauthorized: Message does not belong to user');
    }

    // Finalize message
    await ctx.db.patch(args.messageId, {
      content: args.finalContent,
      isStreaming: false,
    });

    // Update chat's updatedAt timestamp
    await ctx.db.patch(message.chatId, {
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Soft delete a chat
export const softDeleteChat = mutation({
  args: {
    chatId: v.id('chats'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    // Verify the chat belongs to the authenticated user
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.userId !== user._id) {
      throw new Error('Unauthorized: Chat does not belong to user');
    }

    // Mark chat as deleted
    await ctx.db.patch(args.chatId, {
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});
