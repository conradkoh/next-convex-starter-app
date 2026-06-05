// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface ProviderRow {
  _id: string;
  gatewayId: string;
  slug: string;
  label: string;
  apiKeyEnvVar?: string;
  isEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function listProviders(db: Db, gatewayId: string): Promise<ProviderRow[]> {
  return db
    .query('llmProviders')
    .withIndex('by_gatewayId', (q: Db) => q.eq('gatewayId', gatewayId))
    .collect();
}

export async function upsertProvider(
  db: Db,
  params: {
    gatewayId: string;
    slug: string;
    label: string;
    apiKeyEnvVar?: string;
    isEnabled?: boolean;
  }
): Promise<string> {
  const existing = await db
    .query('llmProviders')
    .withIndex('by_gatewayId', (q: Db) => q.eq('gatewayId', params.gatewayId))
    .collect();

  const match = existing.find((p: ProviderRow) => p.slug === params.slug);
  const now = Date.now();

  if (match) {
    await db.patch('llmProviders', match._id, {
      label: params.label,
      apiKeyEnvVar: params.apiKeyEnvVar,
      updatedAt: now,
    });
    return match._id;
  }

  return db.insert('llmProviders', {
    gatewayId: params.gatewayId,
    slug: params.slug,
    label: params.label,
    apiKeyEnvVar: params.apiKeyEnvVar,
    isEnabled: params.isEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  });
}

export async function toggleProviderEnabled(
  db: Db,
  providerId: string,
  enabled: boolean
): Promise<void> {
  await db.patch('llmProviders', providerId, {
    isEnabled: enabled,
    updatedAt: Date.now(),
  });
}
