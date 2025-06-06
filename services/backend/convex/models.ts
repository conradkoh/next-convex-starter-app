import { SessionIdArg } from 'convex-helpers/server/sessions';
import { v } from 'convex/values';
import { getAuthUser } from '../modules/auth/getAuthUser';
import { mutation, query } from './_generated/server';

/**
 * Model interface for chat models
 */
export interface ChatModel {
  id: string;
  name: string;
  category: 'fast' | 'smart';
  provider: string;
  description?: string;
}

/**
 * Model category type
 */
export type ModelCategory = 'fast' | 'smart';

/**
 * Curated list of default models available to all users
 */
const DEFAULT_MODELS: ChatModel[] = [
  // Fast Models
  {
    id: 'google/gemini-2.5-flash-preview-05-20',
    name: 'Gemini 2.5 Flash',
    category: 'fast',
    provider: 'Google',
    description: 'Fast and efficient for most tasks',
  },
  {
    id: 'google/gemini-2.5-flash-preview-05-20:thinking',
    name: 'Gemini 2.5 Flash (Thinking)',
    category: 'fast',
    provider: 'Google',
    description: 'Fast model with reasoning capabilities',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    category: 'fast',
    provider: 'OpenAI',
    description: 'Lightweight and cost-effective',
  },

  // Smart Models
  {
    id: 'openai/gpt-4o-2024-11-20',
    name: 'GPT-4o',
    category: 'smart',
    provider: 'OpenAI',
    description: 'Advanced reasoning and analysis',
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    category: 'smart',
    provider: 'Anthropic',
    description: 'Excellent for complex reasoning',
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    category: 'smart',
    provider: 'OpenAI',
    description: 'Latest GPT-4 model',
  },
];

/**
 * Extended list of models that can be used for search/custom selection
 * Includes the removed models and other popular options
 */
const EXTENDED_MODELS: ChatModel[] = [
  ...DEFAULT_MODELS,

  // Additional Fast Models
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    category: 'fast',
    provider: 'Google',
    description: 'Previous generation fast model',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    category: 'fast',
    provider: 'Google',
    description: 'Intermediate generation model',
  },

  // Additional Smart Models
  {
    id: 'google/gemini-2.5-pro-preview',
    name: 'Gemini 2.5 Pro Preview',
    category: 'smart',
    provider: 'Google',
    description: 'Advanced reasoning model',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    category: 'smart',
    provider: 'Anthropic',
    description: 'Previous generation Claude',
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    category: 'smart',
    provider: 'OpenAI',
    description: 'Fast GPT-4 variant',
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B',
    category: 'smart',
    provider: 'Meta',
    description: 'Large open-source model',
  },
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    category: 'smart',
    provider: 'Mistral',
    description: 'European AI model',
  },
];

/**
 * Default model ID to use when no model is selected
 */
export const DEFAULT_MODEL_ID = 'google/gemini-2.5-flash-preview-05-20';

/**
 * Validates if a model ID is supported (either in default or extended list)
 */
export function isValidModelId(modelId: string): boolean {
  return (
    EXTENDED_MODELS.some((model) => model.id === modelId) ||
    // Allow any model ID that follows the provider/model-name pattern
    /^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_.:]+$/.test(modelId)
  );
}

/**
 * Gets model details by ID from the extended list
 */
export function getModelById(modelId: string): ChatModel | null {
  return EXTENDED_MODELS.find((model) => model.id === modelId) || null;
}

/**
 * Categorizes models by their category
 */
function categorizeModels(models: ChatModel[]) {
  return models.reduce(
    (acc, model) => {
      acc[model.category].push(model);
      return acc;
    },
    { fast: [], smart: [] } as { [K in ModelCategory]: ChatModel[] }
  );
}

/**
 * Query to get available models for the chat interface
 * Returns default models plus extended models for search
 */
export const getAvailableModels = query({
  args: {},
  handler: async () => {
    const defaultCategories = categorizeModels(DEFAULT_MODELS);
    const extendedCategories = categorizeModels(EXTENDED_MODELS);

    return {
      // Default models shown in the main selector
      defaultModels: DEFAULT_MODELS,
      defaultCategories,

      // Extended models for search/custom selection
      extendedModels: EXTENDED_MODELS,
      extendedCategories,

      // Default model ID
      defaultModelId: DEFAULT_MODEL_ID,
    };
  },
});

/**
 * Query to get user's custom models
 */
export const getUserCustomModels = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);

    const customModels = await ctx.db
      .query('chatUserCustomModels')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc') // Most recently used first
      .collect();

    return customModels.map((model) => ({
      id: model.modelId,
      name: model.name || model.modelId.split('/').pop() || model.modelId,
      category: model.category || 'smart',
      provider: model.provider || model.modelId.split('/')[0] || 'Custom',
      description: model.description,
      usageCount: model.usageCount,
      lastUsedAt: model.lastUsedAt,
    }));
  },
});

/**
 * Mutation to add or update a custom model
 */
export const addCustomModel = mutation({
  args: {
    modelId: v.string(),
    name: v.optional(v.string()),
    category: v.optional(v.union(v.literal('fast'), v.literal('smart'))),
    provider: v.optional(v.string()),
    description: v.optional(v.string()),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    const now = Date.now();

    // Check if this custom model already exists for the user
    const existing = await ctx.db
      .query('chatUserCustomModels')
      .withIndex('by_user_model', (q) => q.eq('userId', user._id).eq('modelId', args.modelId))
      .first();

    if (existing) {
      // Update existing model
      await ctx.db.patch(existing._id, {
        name: args.name,
        category: args.category,
        provider: args.provider,
        description: args.description,
        lastUsedAt: now,
      });
      return existing._id;
    }

    // Create new custom model
    return await ctx.db.insert('chatUserCustomModels', {
      userId: user._id,
      modelId: args.modelId,
      name: args.name,
      category: args.category,
      provider: args.provider,
      description: args.description,
      usageCount: 0,
      lastUsedAt: now,
      createdAt: now,
    });
  },
});

/**
 * Mutation to increment usage count for a custom model
 */
export const incrementModelUsage = mutation({
  args: {
    modelId: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    const now = Date.now();

    const customModel = await ctx.db
      .query('chatUserCustomModels')
      .withIndex('by_user_model', (q) => q.eq('userId', user._id).eq('modelId', args.modelId))
      .first();

    if (customModel) {
      await ctx.db.patch(customModel._id, {
        usageCount: customModel.usageCount + 1,
        lastUsedAt: now,
      });
    }
  },
});

/**
 * Query to search models (both extended and custom)
 */
export const searchModels = query({
  args: {
    query: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    const searchQuery = args.query.toLowerCase();

    // Get user's custom models
    const customModels = await ctx.db
      .query('chatUserCustomModels')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    // Convert custom models to ChatModel format
    const customChatModels: ChatModel[] = customModels.map((model) => ({
      id: model.modelId,
      name: model.name || model.modelId.split('/').pop() || model.modelId,
      category: model.category || 'smart',
      provider: model.provider || model.modelId.split('/')[0] || 'Custom',
      description: model.description,
    }));

    // Combine extended models and custom models
    const allModels = [...EXTENDED_MODELS, ...customChatModels];

    // Filter models based on search query
    const filteredModels = allModels.filter((model) => {
      return (
        model.id.toLowerCase().includes(searchQuery) ||
        model.name.toLowerCase().includes(searchQuery) ||
        model.provider.toLowerCase().includes(searchQuery) ||
        model.description?.toLowerCase().includes(searchQuery)
      );
    });

    // Remove duplicates (prefer custom models over extended models)
    const uniqueModels = filteredModels.reduce((acc, model) => {
      const existingIndex = acc.findIndex((m) => m.id === model.id);
      if (existingIndex === -1) {
        acc.push(model);
      } else {
        // If it's a custom model, replace the extended model
        const isCustom = customChatModels.some((cm) => cm.id === model.id);
        if (isCustom) {
          acc[existingIndex] = model;
        }
      }
      return acc;
    }, [] as ChatModel[]);

    return uniqueModels.slice(0, 20); // Limit to 20 results
  },
});

/**
 * Query to get user's preferred model for new chats
 */
export const getUserPreferredModel = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);

    const preference = await ctx.db
      .query('chatUserPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    return {
      preferredModelId: preference?.preferredModelId || DEFAULT_MODEL_ID,
    };
  },
});

/**
 * Mutation to set user's preferred model for new chats
 */
export const setUserPreferredModel = mutation({
  args: {
    modelId: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    const now = Date.now();

    // Validate the model ID
    if (!isValidModelId(args.modelId)) {
      throw new Error('Invalid model ID');
    }

    // Check if user preferences already exist
    const existing = await ctx.db
      .query('chatUserPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        preferredModelId: args.modelId,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new preferences
    return await ctx.db.insert('chatUserPreferences', {
      userId: user._id,
      preferredModelId: args.modelId,
      createdAt: now,
      updatedAt: now,
    });
  },
});
