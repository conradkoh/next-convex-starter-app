import { SessionIdArg } from 'convex-helpers/server/sessions';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { getAuthUser } from '../modules/auth/getAuthUser';
import { getAuthUserSafe } from '../modules/auth/getAuthUserSafe';
import { authError } from '../modules/auth/types/AuthError';
import type { ChatResult } from '../modules/chat/types/ChatResult';
import { type Result, success } from '../modules/common/types/Result';
import type { Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';

// Create a new chat session
export const createChat = mutation({
  args: {
    selectedModel: v.string(),
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
      selectedModel: args.selectedModel,
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
        modelUsed: string;
        attachments?: Array<{
          storageId: Id<'_storage'>;
          metadata: {
            name: string;
            size: number;
            type: string;
            uploadedAt: number;
          };
        }>;
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
      modelUsed: 'user', // User messages don't use AI models
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
      selectedModel: string;
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
      selectedModel: string;
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
      selectedModel: chat.selectedModel,
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
      modelUsed: chat.selectedModel,
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
    modelUsed: v.string(),
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
      modelUsed: args.modelUsed,
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

    // Mark chat as deleted (files will be cleaned up by cron job)
    await ctx.db.patch(args.chatId, {
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update the selected model for a chat
export const updateChatModel = mutation({
  args: {
    chatId: v.id('chats'),
    selectedModel: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
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

    // Update the chat's selected model
    await ctx.db.patch(args.chatId, {
      selectedModel: args.selectedModel,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Generate upload URL for file attachments (supports any file type)
export const generateFileUploadUrl = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    await getAuthUser(ctx, args);

    // Generate upload URL for file
    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL from storage
export const getFileUrl = query({
  args: {
    storageId: v.id('_storage'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    await getAuthUser(ctx, args);

    // Get the file URL
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Send a message with file attachments
export const sendMessageWithAttachments = mutation({
  args: {
    chatId: v.id('chats'),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id('_storage'),
          metadata: v.object({
            name: v.string(),
            size: v.number(),
            type: v.string(),
          }),
        })
      )
    ),
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

    // Validate attachments and create file attachment records if provided
    if (args.attachments) {
      // Validate all attachments first
      for (const attachment of args.attachments) {
        // Check file size (50MB max for general files, 10MB for images)
        const isImage = attachment.metadata.type.startsWith('image/');
        const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

        if (attachment.metadata.size > maxSize) {
          const maxSizeMB = Math.round(maxSize / (1024 * 1024));
          throw new Error(`File "${attachment.metadata.name}" exceeds ${maxSizeMB}MB limit`);
        }

        // Check file type - support images, text files, and common document formats
        const allowedTypes = [
          'image/',
          'text/',
          'application/json',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml',
        ];

        const isAllowedType = allowedTypes.some((type) =>
          attachment.metadata.type.startsWith(type)
        );
        if (!isAllowedType) {
          throw new Error(`File type "${attachment.metadata.type}" is not supported`);
        }
      }

      // Create file attachment records in parallel
      await Promise.all(
        args.attachments.map((attachment) =>
          ctx.db.insert('chatFileAttachments', {
            storageId: attachment.storageId,
            userId: user._id,
            metadata: attachment.metadata,
            uploadedAt: now,
          })
        )
      );
    }

    // Prepare attachments with upload timestamp
    const processedAttachments = args.attachments?.map((attachment) => ({
      ...attachment,
      metadata: {
        ...attachment.metadata,
        uploadedAt: now,
      },
    }));

    // Add user message with optional attachments
    const messageId = await ctx.db.insert('chatMessages', {
      chatId: args.chatId,
      content: args.content,
      role: 'user',
      timestamp: now,
      modelUsed: 'user', // User messages don't use AI models
      attachments: processedAttachments,
    });

    // Update file attachment records with message ID in parallel
    if (args.attachments) {
      await Promise.all(
        args.attachments.map(async (attachment) => {
          const fileRecord = await ctx.db
            .query('chatFileAttachments')
            .withIndex('by_storage_id', (q) => q.eq('storageId', attachment.storageId))
            .first();

          if (fileRecord) {
            await ctx.db.patch(fileRecord._id, { messageId });
          }
        })
      );
    }

    // Update chat's updatedAt timestamp and increment message count
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
      messageCount: chat.messageCount + 1,
    });

    return { success: true };
  },
});

// Manual cleanup of files for a specific chat (useful for testing or manual cleanup)
export const cleanupChatFiles = mutation({
  args: {
    chatId: v.id('chats'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
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

    // Get all messages in this chat to find associated files
    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .collect();

    // Collect all storage IDs from message attachments
    const storageIdsToDelete = new Set<string>();
    for (const message of messages) {
      if (message.attachments) {
        for (const attachment of message.attachments) {
          storageIdsToDelete.add(attachment.storageId);
        }
      }
    }

    // Delete files from storage and chatFileAttachments table in parallel
    const fileDeleteResults = await Promise.allSettled(
      Array.from(storageIdsToDelete).map(async (storageId) => {
        // Delete from Convex storage
        await ctx.storage.delete(storageId as Id<'_storage'>);

        // Remove from chatFileAttachments table
        const fileRecord = await ctx.db
          .query('chatFileAttachments')
          .withIndex('by_storage_id', (q) => q.eq('storageId', storageId as Id<'_storage'>))
          .first();

        if (fileRecord) {
          await ctx.db.delete(fileRecord._id);
        }

        return storageId;
      })
    );

    // Count successful deletions and log errors
    let deletedCount = 0;
    let errorCount = 0;
    for (const result of fileDeleteResults) {
      if (result.status === 'fulfilled') {
        deletedCount++;
      } else {
        console.error(`Failed to delete file ${result.reason}:`, result.reason);
        errorCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      errorCount,
      totalFiles: storageIdsToDelete.size,
    };
  },
});

// Internal mutation to get deleted chats that need cleanup
export const getDeletedChats = internalMutation({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago

    // Get one extra record to determine if there are more
    const deletedChats = await ctx.db
      .query('chats')
      .filter((q) =>
        q.and(q.eq(q.field('isDeleted'), true), q.lt(q.field('deletedAt'), sevenDaysAgo))
      )
      .take(args.limit + 1);

    const hasNext = deletedChats.length > args.limit;
    const chatsToReturn = hasNext ? deletedChats.slice(0, args.limit) : deletedChats;

    return {
      chats: chatsToReturn.map((chat) => ({
        _id: chat._id,
        deletedAt: chat.deletedAt,
      })),
      hasNext,
    };
  },
});

// Internal mutation to hard delete chats and all associated data
export const hardDeleteChats = internalMutation({
  args: {
    chatIds: v.array(v.id('chats')),
  },
  handler: async (ctx, args) => {
    let chatsProcessed = 0;
    let filesDeleted = 0;
    let errorCount = 0;

    // Process all chats in parallel
    const chatProcessingResults = await Promise.allSettled(
      args.chatIds.map(async (chatId) => {
        // Get all messages in this chat to find associated files
        const messages = await ctx.db
          .query('chatMessages')
          .withIndex('by_chat', (q) => q.eq('chatId', chatId))
          .collect();

        // Collect all storage IDs from message attachments
        const storageIdsToDelete = new Set<string>();
        for (const message of messages) {
          if (message.attachments) {
            for (const attachment of message.attachments) {
              storageIdsToDelete.add(attachment.storageId);
            }
          }
        }

        // Delete files in parallel
        const fileDeleteResults = await Promise.allSettled(
          Array.from(storageIdsToDelete).map(async (storageId) => {
            // Delete from Convex storage
            await ctx.storage.delete(storageId as Id<'_storage'>);

            // Remove from chatFileAttachments table
            const fileRecord = await ctx.db
              .query('chatFileAttachments')
              .withIndex('by_storage_id', (q) => q.eq('storageId', storageId as Id<'_storage'>))
              .first();

            if (fileRecord) {
              await ctx.db.delete(fileRecord._id);
            }

            return storageId;
          })
        );

        // Count successful file deletions
        const successfulFileDeletions = fileDeleteResults.filter(
          (result) => result.status === 'fulfilled'
        ).length;
        const failedFileDeletions = fileDeleteResults.filter(
          (result) => result.status === 'rejected'
        ).length;

        // Delete all messages in parallel
        await Promise.all(messages.map((message) => ctx.db.delete(message._id)));

        // Finally, delete the chat itself
        await ctx.db.delete(chatId);

        return {
          chatId,
          filesDeleted: successfulFileDeletions,
          fileErrors: failedFileDeletions,
          messagesDeleted: messages.length,
        };
      })
    );

    // Aggregate results
    for (const result of chatProcessingResults) {
      if (result.status === 'fulfilled') {
        chatsProcessed++;
        filesDeleted += result.value.filesDeleted;
        errorCount += result.value.fileErrors;
      } else {
        errorCount++;
      }
    }

    return {
      chatsProcessed,
      filesDeleted,
      errorCount,
    };
  },
});
