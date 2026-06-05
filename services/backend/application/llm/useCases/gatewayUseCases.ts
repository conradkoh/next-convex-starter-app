import type { LLMGatewayKind } from '../entities/gateway';

export interface GatewayRow {
  _id: string;
  kind: LLMGatewayKind;
  label: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export async function listGateways(db: Db): Promise<GatewayRow[]> {
  return db.query('llmGateways').collect();
}

export async function upsertGateway(
  db: Db,
  params: { kind: LLMGatewayKind; label: string }
): Promise<string> {
  const existing = await db.query('llmGateways').first();
  const now = Date.now();

  if (existing) {
    await db.patch('llmGateways', existing._id, {
      kind: params.kind,
      label: params.label,
      updatedAt: now,
    });
    return existing._id;
  }

  return db.insert('llmGateways', {
    kind: params.kind,
    label: params.label,
    isActive: false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function setActiveGateway(db: Db, gatewayId: string): Promise<void> {
  const all = await db.query('llmGateways').collect();
  const now = Date.now();

  for (const gw of all) {
    if (gw._id === gatewayId) {
      await db.patch('llmGateways', gw._id, { isActive: true, updatedAt: now });
    } else if (gw.isActive) {
      await db.patch('llmGateways', gw._id, { isActive: false, updatedAt: now });
    }
  }
}
