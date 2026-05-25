import { describe, expect, it } from 'vitest';

import type { ProviderRow } from '../providerUseCases';
import { listProviders, toggleProviderEnabled, upsertProvider } from '../providerUseCases';

function makeProviderDb(rows: ProviderRow[] = []) {
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
    insert: async (_table: string, value: Omit<ProviderRow, '_id'>) => {
      const id = `prov_${nextId++}`;
      data.push({ ...value, _id: id });
      return id;
    },
    patch: async (_table: string, id: string, value: Partial<Omit<ProviderRow, '_id'>>) => {
      const idx = data.findIndex((r) => r._id === id);
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...value };
      }
    },
  };
}

describe('providerUseCases', () => {
  describe('upsertProvider', () => {
    it('creates a new provider', async () => {
      const db = makeProviderDb();
      const id = await upsertProvider(db, {
        gatewayId: 'gw_1',
        slug: 'openai',
        label: 'OpenAI',
      });
      expect(id).toBe('prov_1');
      const all = await listProviders(db, 'gw_1');
      expect(all).toHaveLength(1);
      expect(all[0].isEnabled).toBe(true);
    });

    it('updates an existing provider with the same slug', async () => {
      const db = makeProviderDb([
        {
          _id: 'prov_1',
          gatewayId: 'gw_1',
          slug: 'openai',
          label: 'Old OpenAI',
          isEnabled: true,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]);
      const id = await upsertProvider(db, {
        gatewayId: 'gw_1',
        slug: 'openai',
        label: 'New OpenAI',
      });
      expect(id).toBe('prov_1');
      const all = await listProviders(db, 'gw_1');
      expect(all[0].label).toBe('New OpenAI');
    });
  });

  describe('toggleProviderEnabled', () => {
    it('disables a provider', async () => {
      const db = makeProviderDb([
        {
          _id: 'prov_1',
          gatewayId: 'gw_1',
          slug: 'openai',
          label: 'OpenAI',
          isEnabled: true,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]);
      await toggleProviderEnabled(db, 'prov_1', false);
      const all = await listProviders(db, 'gw_1');
      expect(all[0].isEnabled).toBe(false);
    });
  });
});
