import type { SessionId } from 'convex-helpers/server/sessions';
import { expect, test } from 'vitest';

import { t } from '../test.setup';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';

interface CaughtError {
  data: unknown;
}

async function captureError(run: () => Promise<unknown>): Promise<CaughtError> {
  try {
    await run();
  } catch (error) {
    return error as CaughtError;
  }
  throw new Error('Expected the Convex call to reject');
}

async function loginAsStandardUser(): Promise<{ sessionId: SessionId; userId: Id<'users'> }> {
  const sessionId = `contract-user-${Math.random().toString(36).slice(2)}` as SessionId;
  const login = await t.mutation(api.auth.loginAnon, { sessionId });
  expect(login.success).toBe(true);
  const userId = login.userId as Id<'users'>;
  await t.run(async (ctx) => {
    await ctx.db.patch('users', userId, { accessLevel: 'user' });
  });
  return { sessionId, userId };
}

function expectSerializablePayload(data: unknown): void {
  expect(JSON.parse(JSON.stringify(data))).toStrictEqual(data);
  expect(Object.values(data as Record<string, unknown>)).not.toContain(undefined);
}

test('a missing checklist rejects with the NOT_FOUND payload', async () => {
  const { sessionId } = await loginAsStandardUser();

  const error = await captureError(() =>
    t.mutation(api.checklists.addChecklistItem, { checklistKey: 'missing', text: 'x', sessionId })
  );

  expect(error.data).toStrictEqual({
    code: 'NOT_FOUND',
    message: 'Checklist not found',
    details: { resource: 'checklist' },
  });
  expectSerializablePayload(error.data);
});

test('a standard user cannot create invites (FORBIDDEN keeps the permission key in details)', async () => {
  const { sessionId } = await loginAsStandardUser();

  const error = await captureError(() =>
    t.mutation(api.admin.invites.createInvite, {
      sessionId,
      inviteeName: 'Jane Doe',
      inviteeEmail: 'jane@example.com',
    })
  );

  const data = error.data as { code: string; message: string; details?: { permission?: string } };
  expect(data.code).toBe('FORBIDDEN');
  expect(data.message).toBe('You do not have permission to perform this action');
  expect(data.message).not.toContain('invites:manage');
  expect(data.details?.permission).toBe('invites:manage');
  expectSerializablePayload(error.data);
});

test('a concluded checklist rejects with the CONFLICT payload', async () => {
  const { sessionId } = await loginAsStandardUser();
  const checklistKey = `contract-conflict-${Math.random().toString(36).slice(2)}`;

  await t.mutation(api.checklists.createChecklist, {
    key: checklistKey,
    title: 'Contract spec checklist',
    sessionId,
  });
  await t.mutation(api.checklists.concludeChecklist, { checklistKey, sessionId });

  const error = await captureError(() =>
    t.mutation(api.checklists.addChecklistItem, {
      checklistKey,
      text: 'x',
      sessionId,
    })
  );

  expect(error.data).toStrictEqual({
    code: 'CONFLICT',
    message: 'Checklist is no longer active',
    details: { resource: 'checklist', reason: 'inactive' },
  });
  expectSerializablePayload(error.data);
});

test('an unknown session rejects with a neutral NOT_AUTHENTICATED message', async () => {
  const sessionId = 'never-logged-in' as SessionId;

  const error = await captureError(() =>
    t.mutation(api.admin.invites.createInvite, {
      sessionId,
      inviteeName: 'Jane Doe',
      inviteeEmail: 'jane@example.com',
    })
  );

  expect(error.data).toStrictEqual({
    code: 'NOT_AUTHENTICATED',
    message: 'You must be logged in to manage invites',
  });
  expectSerializablePayload(error.data);
});
