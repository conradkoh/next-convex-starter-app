import { describe, expect, it } from 'vitest';

import type { ModelRow } from '../modelUseCases';
import { listModels, setDefaultModel, toggleModelEnabled, upsertModel } from '../modelUseCases';

function makeModelDb(rows: ModelRow[] = []) {
  const data = [...rows];
  let nextId = 1;

  return {
    data,
    query: () => ({
      withIndex: (_index: string, _q: unknown) => ({
        collect: async () => [...data],
        first: async () => (data.length > 0 ? { ...data[0] } : null),
      }),
    }),
    insert: async (_table: string, value: Omit<ModelRow, '_id'>) => {
      const id = `mdl_${nextId++}`;
      data.push({ ...value, _id: id });
      return id;
    },
    patch: async (_table: string, id: string, value: Partial<Omit<ModelRow, '_id'>>) => {
      const idx = data.findIndex((r) => r._id === id);
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...value };
      }
    },
  };
}

describe('modelUseCases', () => {
  describe('upsertModel', () => {
    it('creates a new model', async () => {
      const db = makeModelDb();
      const id = await upsertModel(db, {
        providerId: 'prov_1',
        slug: 'gpt-4o',
        label: 'GPT-4o',
      });
      expect(id).toBe('mdl_1');
      const all = await listModels(db, 'prov_1');
      expect(all).toHaveLength(1);
      expect(all[0].isDefault).toBe(false);
    });

    it('updates an existing model with the same slug', async () => {
      const db = makeModelDb([
        {
          _id: 'mdl_1',
          providerId: 'prov_1',
          slug: 'gpt-4o',
          label: 'Old Label',
          isEnabled: true,
          isDefault: false,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]);
      const id = await upsertModel(db, {
        providerId: 'prov_1',
        slug: 'gpt-4o',
        label: 'New Label',
      });
      expect(id).toBe('mdl_1');
      const all = await listModels(db, 'prov_1');
      expect(all[0].label).toBe('New Label');
    });
  });

  describe('toggleModelEnabled', () => {
    it('toggles the enabled flag', async () => {
      const db = makeModelDb([
        {
          _id: 'mdl_1',
          providerId: 'prov_1',
          slug: 'gpt-4o',
          label: 'GPT-4o',
          isEnabled: true,
          isDefault: false,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]);
      await toggleModelEnabled(db, 'mdl_1', false);
      const all = await listModels(db, 'prov_1');
      expect(all[0].isEnabled).toBe(false);
    });
  });

  describe('setDefaultModel', () => {
    it('sets one model as default and unsets others for the same provider', async () => {
      const db = makeModelDb([
        {
          _id: 'mdl_1',
          providerId: 'prov_1',
          slug: 'gpt-4o',
          label: 'GPT-4o',
          isEnabled: true,
          isDefault: true,
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          _id: 'mdl_2',
          providerId: 'prov_1',
          slug: 'gpt-4o-mini',
          label: 'GPT-4o Mini',
          isEnabled: true,
          isDefault: false,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]);
      await setDefaultModel(db, 'mdl_2', 'prov_1');
      const all = await listModels(db, 'prov_1');
      const m1 = all.find((m) => m._id === 'mdl_1')!;
      const m2 = all.find((m) => m._id === 'mdl_2')!;
      expect(m1.isDefault).toBe(false);
      expect(m2.isDefault).toBe(true);
    });
  });
});
