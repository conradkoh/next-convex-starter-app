// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface ModelRow {
  _id: string;
  providerId: string;
  slug: string;
  label: string;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function listModels(db: Db, providerId: string): Promise<ModelRow[]> {
  return db
    .query('llmModels')
    .withIndex('by_providerId', (q: Db) => q.eq('providerId', providerId))
    .collect();
}

export async function upsertModel(
  db: Db,
  params: {
    providerId: string;
    slug: string;
    label: string;
    isEnabled?: boolean;
    isDefault?: boolean;
  }
): Promise<string> {
  const existing = await db
    .query('llmModels')
    .withIndex('by_providerId', (q: Db) => q.eq('providerId', params.providerId))
    .collect();

  const match = existing.find((m: ModelRow) => m.slug === params.slug);
  const now = Date.now();

  if (match) {
    await db.patch('llmModels', match._id, {
      label: params.label,
      updatedAt: now,
    });
    return match._id;
  }

  return db.insert('llmModels', {
    providerId: params.providerId,
    slug: params.slug,
    label: params.label,
    isEnabled: params.isEnabled ?? true,
    isDefault: params.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function toggleModelEnabled(db: Db, modelId: string, enabled: boolean): Promise<void> {
  await db.patch('llmModels', modelId, {
    isEnabled: enabled,
    updatedAt: Date.now(),
  });
}

export async function setDefaultModel(db: Db, modelId: string, providerId: string): Promise<void> {
  const models = await db
    .query('llmModels')
    .withIndex('by_providerId', (q: Db) => q.eq('providerId', providerId))
    .collect();

  const now = Date.now();

  for (const m of models as ModelRow[]) {
    if (m._id === modelId) {
      await db.patch('llmModels', m._id, { isDefault: true, updatedAt: now });
    } else if (m.isDefault) {
      await db.patch('llmModels', m._id, { isDefault: false, updatedAt: now });
    }
  }
}
