import { describe, expect, it } from 'vitest';

import type { CatalogModelsRow, CatalogProvidersRow } from '../catalogUseCases';
import { enableCatalogModel, getCatalog } from '../catalogUseCases';

function makeCatalogDb() {
  const providers: CatalogProvidersRow[] = [];
  const models: CatalogModelsRow[] = [];
  let nextProvId = 1;
  let nextMdlId = 1;

  return {
    query: (table: string) => ({
      withIndex: (index: string, qFn: unknown) => {
        const collector = {
          table,
          index,
          filters: undefined as undefined | { field: string; value: string },
          applyFilter(field: string, value: string) {
            this.filters = { field, value };
            return this;
          },
          async collect() {
            if (table === 'llmProviders' && collector.filters) {
              return providers.filter(
                (p) =>
                  p[collector.filters!.field as keyof CatalogProvidersRow] ===
                  collector.filters!.value
              );
            }
            if (table === 'llmModels' && collector.filters) {
              return models.filter(
                (m) =>
                  m[collector.filters!.field as keyof CatalogModelsRow] === collector.filters!.value
              );
            }
            return [];
          },
          async first() {
            const all = (await this.collect()) as CatalogProvidersRow[];
            return all.length > 0 ? { ...all[0] } : null;
          },
        };
        if (typeof qFn === 'function') {
          const qb = {
            eq: (field: string, value: string) => {
              collector.filters = { field, value };
              return collector;
            },
          };
          return (qFn as (q: typeof qb) => unknown)(qb);
        }
        return collector;
      },
    }),
    insert: async (table: string, value: Record<string, unknown>) => {
      if (table === 'llmProviders') {
        const id = `prov_${nextProvId++}`;
        providers.push({ ...(value as unknown as CatalogProvidersRow), _id: id });
        return id;
      }
      const id = `mdl_${nextMdlId++}`;
      models.push({ ...(value as unknown as CatalogModelsRow), _id: id });
      return id;
    },
    patch: async (table: string, id: string, value: Record<string, unknown>) => {
      if (table === 'llmProviders') {
        const idx = providers.findIndex((p) => p._id === id);
        if (idx >= 0) providers[idx] = { ...providers[idx], ...value } as CatalogProvidersRow;
      } else {
        const idx = models.findIndex((m) => m._id === id);
        if (idx >= 0) models[idx] = { ...models[idx], ...value } as CatalogModelsRow;
      }
    },
  };
}

describe('catalogUseCases', () => {
  describe('enableCatalogModel', () => {
    it('creates provider and model on first enable', async () => {
      const db = makeCatalogDb();
      const result = await enableCatalogModel(db, {
        gatewayId: 'gw_1',
        providerSlug: 'openai',
        providerLabel: 'OpenAI',
        modelSlug: 'gpt-4o',
        modelLabel: 'GPT-4o',
      });

      expect(result.providerId).toBe('prov_1');
      expect(result.modelId).toBe('mdl_1');

      const catalog = await getCatalog(db, 'gw_1');
      expect(catalog).toHaveLength(1);
      expect(catalog[0].providerSlug).toBe('openai');
      expect(catalog[0].isEnabled).toBe(true);
      expect(catalog[0].models).toHaveLength(1);
      expect(catalog[0].models[0].modelSlug).toBe('gpt-4o');
      expect(catalog[0].models[0].isEnabled).toBe(true);
      expect(catalog[0].models[0].isDefault).toBe(false);
    });

    it('toggles model off when already enabled', async () => {
      const db = makeCatalogDb();

      await enableCatalogModel(db, {
        gatewayId: 'gw_1',
        providerSlug: 'openai',
        providerLabel: 'OpenAI',
        modelSlug: 'gpt-4o',
        modelLabel: 'GPT-4o',
      });

      await enableCatalogModel(db, {
        gatewayId: 'gw_1',
        providerSlug: 'openai',
        providerLabel: 'OpenAI',
        modelSlug: 'gpt-4o',
        modelLabel: 'GPT-4o',
      });

      const catalog = await getCatalog(db, 'gw_1');
      expect(catalog[0].models).toHaveLength(1);
      expect(catalog[0].models[0].isEnabled).toBe(false);
    });

    it('re-uses existing provider when enabling a different model', async () => {
      const db = makeCatalogDb();

      await enableCatalogModel(db, {
        gatewayId: 'gw_1',
        providerSlug: 'openai',
        providerLabel: 'OpenAI',
        modelSlug: 'gpt-4o',
        modelLabel: 'GPT-4o',
      });

      await enableCatalogModel(db, {
        gatewayId: 'gw_1',
        providerSlug: 'openai',
        providerLabel: 'OpenAI',
        modelSlug: 'gpt-4o-mini',
        modelLabel: 'GPT-4o Mini',
      });

      const catalog = await getCatalog(db, 'gw_1');
      expect(catalog).toHaveLength(1);
      expect(catalog[0].providerId).toBe('prov_1');
      expect(catalog[0].models).toHaveLength(2);
      expect(catalog[0].models[0].modelSlug).toBe('gpt-4o');
      expect(catalog[0].models[1].modelSlug).toBe('gpt-4o-mini');
    });
  });

  describe('getCatalog', () => {
    it('returns empty array when no providers exist', async () => {
      const db = makeCatalogDb();
      const catalog = await getCatalog(db, 'gw_1');
      expect(catalog).toEqual([]);
    });

    it('returns providers with their models', async () => {
      const db = makeCatalogDb();

      await enableCatalogModel(db, {
        gatewayId: 'gw_1',
        providerSlug: 'openai',
        providerLabel: 'OpenAI',
        modelSlug: 'gpt-4o',
        modelLabel: 'GPT-4o',
      });

      const catalog = await getCatalog(db, 'gw_1');
      expect(catalog).toHaveLength(1);
      expect(catalog[0].models).toHaveLength(1);
      expect(catalog[0].models[0].modelSlug).toBe('gpt-4o');
    });
  });
});
