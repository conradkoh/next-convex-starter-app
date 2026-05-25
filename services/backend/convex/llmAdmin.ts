import { ConvexError, v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import type { Doc } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import {
  listGateways,
  upsertGateway,
  setActiveGateway,
} from '../application/llm/useCases/gatewayUseCases';
import {
  listModels,
  setDefaultModel,
  toggleModelEnabled,
  upsertModel,
} from '../application/llm/useCases/modelUseCases';
import {
  listProviders,
  toggleProviderEnabled,
  upsertProvider,
} from '../application/llm/useCases/providerUseCases';
import { isSystemAdmin } from '../modules/auth/accessControl';
import { getAuthUserOptional } from '../modules/auth/getAuthUser';

function requireAdmin(user: Doc<'users'> | null): asserts user is Doc<'users'> {
  if (!user || !isSystemAdmin(user)) {
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: 'Only system administrators can manage LLM configuration',
    });
  }
}

export const getGateways = query({
  args: { ...SessionIdArg },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return listGateways(ctx.db);
  },
});

export const createOrUpdateGateway = mutation({
  args: {
    kind: v.union(v.literal('vercel-ai-gateway')),
    label: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return upsertGateway(ctx.db, { kind: args.kind, label: args.label });
  },
});

export const activateGateway = mutation({
  args: {
    gatewayId: v.id('llmGateways'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return setActiveGateway(ctx.db, args.gatewayId);
  },
});

export const getProviders = query({
  args: {
    gatewayId: v.id('llmGateways'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return listProviders(ctx.db, args.gatewayId);
  },
});

export const createOrUpdateProvider = mutation({
  args: {
    gatewayId: v.id('llmGateways'),
    slug: v.string(),
    label: v.string(),
    apiKeyEnvVar: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return upsertProvider(ctx.db, {
      gatewayId: args.gatewayId,
      slug: args.slug,
      label: args.label,
      apiKeyEnvVar: args.apiKeyEnvVar,
      isEnabled: args.isEnabled,
    });
  },
});

export const enableProvider = mutation({
  args: {
    providerId: v.id('llmProviders'),
    enabled: v.boolean(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return toggleProviderEnabled(ctx.db, args.providerId, args.enabled);
  },
});

export const getModels = query({
  args: {
    providerId: v.id('llmProviders'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return listModels(ctx.db, args.providerId);
  },
});

export const createOrUpdateModel = mutation({
  args: {
    providerId: v.id('llmProviders'),
    slug: v.string(),
    label: v.string(),
    isEnabled: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return upsertModel(ctx.db, {
      providerId: args.providerId,
      slug: args.slug,
      label: args.label,
      isEnabled: args.isEnabled,
      isDefault: args.isDefault,
    });
  },
});

export const enableModel = mutation({
  args: {
    modelId: v.id('llmModels'),
    enabled: v.boolean(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return toggleModelEnabled(ctx.db, args.modelId, args.enabled);
  },
});

export const makeDefaultModel = mutation({
  args: {
    modelId: v.id('llmModels'),
    providerId: v.id('llmProviders'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserOptional(ctx, args);
    requireAdmin(user);
    return setDefaultModel(ctx.db, args.modelId, args.providerId);
  },
});
