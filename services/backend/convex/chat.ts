import { SessionIdArg } from 'convex-helpers/server/sessions';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { getAuthUser } from '../modules/auth/getAuthUser';
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

    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .order('asc')
      .collect();

    return messages;
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

    // Add auto-response
    await ctx.db.insert('chatMessages', {
      chatId: args.chatId,
      content: 'hello',
      role: 'assistant',
      timestamp: now + 1, // Slightly later timestamp to ensure order
    });

    // Update chat's updatedAt timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
    });

    return { success: true };
  },
});

// Get the latest chat for the current user/session
export const getLatestChat = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    // Find the latest chat for this user
    const chats = await ctx.db
      .query('chats')
      .filter((q) => q.eq(q.field('userId'), user._id))
      .order('desc')
      .take(1);

    return chats[0] || null;
  },
});

// Get paginated chat history for the current user/session
export const getChatHistory = query({
  args: {
    ...SessionIdArg,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    // Query chats with pagination
    const result = await ctx.db
      .query('chats')
      .filter((q) => q.eq(q.field('userId'), user._id))
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

        const messageCount = await ctx.db
          .query('chatMessages')
          .withIndex('by_chat', (q) => q.eq('chatId', chat._id))
          .collect()
          .then((messages) => messages.length);

        return {
          ...chat,
          summary: firstMessage?.content || 'New chat',
          messageCount,
        };
      })
    );

    return {
      ...result,
      page: chatsWithSummary,
    };
  },
});

// Get chat summary (first message and metadata)
export const getChatSummary = query({
  args: {
    chatId: v.id('chats'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get authenticated user - this will throw if not authenticated
    const user = await getAuthUser(ctx, args);

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return null;
    }

    // Verify the chat belongs to the authenticated user
    if (chat.userId !== user._id) {
      throw new Error('Unauthorized: Chat does not belong to user');
    }

    const firstMessage = await ctx.db
      .query('chatMessages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .order('asc')
      .first();

    const messageCount = await ctx.db
      .query('chatMessages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .collect()
      .then((messages) => messages.length);

    return {
      ...chat,
      summary: firstMessage?.content || 'New chat',
      messageCount,
      firstMessage,
    };
  },
});
