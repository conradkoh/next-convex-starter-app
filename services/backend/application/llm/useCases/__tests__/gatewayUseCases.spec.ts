import { describe, expect, it } from 'vitest';

import type { GatewayRow } from '../gatewayUseCases';
import { listGateways, setActiveGateway, upsertGateway } from '../gatewayUseCases';

function makeGatewayDb(rows: GatewayRow[] = []) {
  const data = [...rows];
  let nextId = 1;

  return {
    data,
    query: () => ({
      collect: async () => [...data],
      first: async () => (data.length > 0 ? { ...data[0] } : null),
    }),
    insert: async (_table: string, value: Omit<GatewayRow, '_id'>) => {
      const id = `gw_${nextId++}`;
      data.push({ ...value, _id: id });
      return id;
    },
    patch: async (_table: string, id: string, value: Partial<Omit<GatewayRow, '_id'>>) => {
      const idx = data.findIndex((r) => r._id === id);
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...value };
      }
    },
  };
}

describe('gatewayUseCases', () => {
  describe('upsertGateway', () => {
    it('creates a new gateway when none exist', async () => {
      const db = makeGatewayDb();
      const id = await upsertGateway(db, {
        kind: 'vercel-ai-gateway',
        label: 'My Gateway',
      });
      expect(id).toBe('gw_1');
      const all = await listGateways(db);
      expect(all).toHaveLength(1);
      expect(all[0].isActive).toBe(false);
    });

    it('updates an existing gateway instead of creating a new one', async () => {
      const db = makeGatewayDb([
        {
          _id: 'gw_1',
          kind: 'vercel-ai-gateway',
          label: 'Old Label',
          isActive: false,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]);
      const id = await upsertGateway(db, {
        kind: 'vercel-ai-gateway',
        label: 'New Label',
      });
      expect(id).toBe('gw_1');
      const all = await listGateways(db);
      expect(all).toHaveLength(1);
      expect(all[0].label).toBe('New Label');
    });
  });

  describe('setActiveGateway', () => {
    it('activates the specified gateway and deactivates others', async () => {
      const db = makeGatewayDb([
        {
          _id: 'gw_1',
          kind: 'vercel-ai-gateway',
          label: 'GW 1',
          isActive: true,
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          _id: 'gw_2',
          kind: 'vercel-ai-gateway',
          label: 'GW 2',
          isActive: false,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ]);
      await setActiveGateway(db, 'gw_2');
      const all = await listGateways(db);
      const gw1 = all.find((g) => g._id === 'gw_1')!;
      const gw2 = all.find((g) => g._id === 'gw_2')!;
      expect(gw1.isActive).toBe(false);
      expect(gw2.isActive).toBe(true);
    });
  });
});
