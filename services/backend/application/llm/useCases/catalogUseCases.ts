// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface CatalogProvidersRow {
  _id: string;
  gatewayId: string;
  slug: string;
  label: string;
  apiKeyEnvVar?: string;
  isEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CatalogModelsRow {
  _id: string;
  providerId: string;
  slug: string;
  label: string;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CatalogProvider {
  providerId: string;
  providerSlug: string;
  providerLabel: string;
  isEnabled: boolean;
  models: CatalogModel[];
}

export interface CatalogModel {
  modelId: string;
  modelSlug: string;
  modelLabel: string;
  isEnabled: boolean;
  isDefault: boolean;
}

export async function getCatalog(db: Db, gatewayId: string): Promise<CatalogProvider[]> {
  const providers = (await db
    .query('llmProviders')
    .withIndex('by_gatewayId', (q: Db) => q.eq('gatewayId', gatewayId))
    .collect()) as CatalogProvidersRow[];

  const result: CatalogProvider[] = [];

  for (const provider of providers) {
    const models = (await db
      .query('llmModels')
      .withIndex('by_providerId', (q: Db) => q.eq('providerId', provider._id))
      .collect()) as CatalogModelsRow[];

    result.push({
      providerId: provider._id,
      providerSlug: provider.slug,
      providerLabel: provider.label,
      isEnabled: provider.isEnabled,
      models: models.map((m) => ({
        modelId: m._id,
        modelSlug: m.slug,
        modelLabel: m.label,
        isEnabled: m.isEnabled,
        isDefault: m.isDefault,
      })),
    });
  }

  return result;
}

export async function enableCatalogModel(
  db: Db,
  params: {
    gatewayId: string;
    providerSlug: string;
    providerLabel: string;
    modelSlug: string;
    modelLabel: string;
  }
): Promise<{ providerId: string; modelId: string }> {
  const now = Date.now();

  const existingProviders = (await db
    .query('llmProviders')
    .withIndex('by_gatewayId', (q: Db) => q.eq('gatewayId', params.gatewayId))
    .collect()) as CatalogProvidersRow[];

  const provider = existingProviders.find((p) => p.slug === params.providerSlug);
  let providerId: string;

  if (provider) {
    providerId = provider._id;
  } else {
    providerId = await db.insert('llmProviders', {
      gatewayId: params.gatewayId,
      slug: params.providerSlug,
      label: params.providerLabel,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const existingModels = (await db
    .query('llmModels')
    .withIndex('by_providerId', (q: Db) => q.eq('providerId', providerId))
    .collect()) as CatalogModelsRow[];

  const model = existingModels.find((m) => m.slug === params.modelSlug);
  let modelId: string;

  if (model) {
    modelId = model._id;
    const newEnabled = !model.isEnabled;
    await db.patch('llmModels', model._id, {
      label: params.modelLabel,
      isEnabled: newEnabled,
      updatedAt: now,
    });
  } else {
    modelId = await db.insert('llmModels', {
      providerId,
      slug: params.modelSlug,
      label: params.modelLabel,
      isEnabled: true,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { providerId, modelId };
}
