import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getFunctionName } from 'convex/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Checklist } from './checklist';

/**
 * Boundary mocks only: Convex session query/mutation. The component, the sync
 * hook, and the inline input all run for real.
 */
const mocks = vi.hoisted(() => ({
  useSessionQuery: vi.fn(),
  useSessionMutation: vi.fn(),
  mutations: {} as Record<string, ReturnType<typeof vi.fn>>,
  state: { exists: true, isActive: true } as Record<string, unknown>,
  items: [] as Record<string, unknown>[],
}));

vi.mock('convex-helpers/react/sessions', () => ({
  useSessionQuery: mocks.useSessionQuery,
  useSessionMutation: mocks.useSessionMutation,
}));

type FunctionReference = Parameters<typeof getFunctionName>[0];

function functionName(reference: FunctionReference): string {
  return getFunctionName(reference).split(':').pop() ?? '';
}

const milk = {
  _id: 'i1',
  _creationTime: 1,
  checklistKey: 'k',
  text: 'Buy milk',
  isCompleted: false,
  order: 0,
  createdAt: 1,
};

const ADD_FAILED_MESSAGE = 'Failed to add item. Text restored for retry.';

function renderChecklist() {
  return render(<Checklist title="Morning Checklist" checklistKey="k" />);
}

async function findAddInput() {
  return screen.findByPlaceholderText('Add new item...');
}

beforeEach(() => {
  mocks.mutations = {
    createChecklist: vi.fn().mockResolvedValue(undefined),
    addChecklistItem: vi.fn().mockResolvedValue(undefined),
    toggleChecklistItem: vi.fn().mockResolvedValue(undefined),
    deleteChecklistItem: vi.fn().mockResolvedValue(undefined),
    concludeChecklist: vi.fn().mockResolvedValue(undefined),
    reopenChecklist: vi.fn().mockResolvedValue(undefined),
    clearCompletedItems: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    reorderChecklistItems: vi.fn().mockResolvedValue(undefined),
  };
  mocks.useSessionMutation.mockImplementation(
    (reference: FunctionReference) => mocks.mutations[functionName(reference)]
  );
  mocks.state = { exists: true, isActive: true };
  mocks.items = [milk];
  mocks.useSessionQuery.mockImplementation((reference: FunctionReference) => {
    const name = functionName(reference);
    if (name === 'getChecklistState') return mocks.state;
    if (name === 'getChecklistItems') return mocks.items;
    return undefined;
  });
});

describe('Checklist add failures', () => {
  it('keeps a failed add in the field with the typed text and no card alert', async () => {
    const user = userEvent.setup();
    mocks.mutations.addChecklistItem.mockRejectedValueOnce(new Error('Network down'));
    renderChecklist();

    const input = await findAddInput();
    await user.type(input, 'Buy eggs{Enter}');

    const message = await screen.findByText(ADD_FAILED_MESSAGE);
    expect(message).toHaveAttribute('role', 'alert');
    expect(input).toHaveValue('Buy eggs');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', message.id);

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toBe(message);
  });

  it('clears the field message when the user types', async () => {
    const user = userEvent.setup();
    mocks.mutations.addChecklistItem.mockRejectedValueOnce(new Error('Network down'));
    renderChecklist();

    const input = await findAddInput();
    await user.type(input, 'Buy eggs{Enter}');
    await screen.findByText(ADD_FAILED_MESSAGE);

    await user.type(input, '!');

    expect(screen.queryByText(ADD_FAILED_MESSAGE)).toBeNull();
  });

  it('clears the field message when the next submit starts', async () => {
    const user = userEvent.setup();
    mocks.mutations.addChecklistItem.mockRejectedValueOnce(new Error('Network down'));
    let rejectAdd!: (error: Error) => void;
    mocks.mutations.addChecklistItem.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectAdd = reject;
      })
    );
    renderChecklist();

    const input = await findAddInput();
    await user.type(input, 'Buy eggs{Enter}');
    await screen.findByText(ADD_FAILED_MESSAGE);

    await user.click(input);
    await user.keyboard('{Enter}');

    expect(screen.queryByText(ADD_FAILED_MESSAGE)).toBeNull();

    await act(async () => {
      rejectAdd(new Error('Network down'));
    });

    expect(await screen.findByText(ADD_FAILED_MESSAGE)).toBeInTheDocument();
  });

  it('restores the field message when the input remounts after a failed add', async () => {
    const user = userEvent.setup();
    let rejectAdd!: (error: Error) => void;
    mocks.mutations.addChecklistItem.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectAdd = reject;
      })
    );
    const { rerender } = renderChecklist();

    const input = await findAddInput();
    await user.type(input, 'Buy eggs{Enter}');

    // Concluding the checklist unmounts the inline input while the add is pending.
    mocks.state = { exists: true, isActive: false };
    rerender(<Checklist title="Morning Checklist" checklistKey="k" />);

    await act(async () => {
      rejectAdd(new Error('Network down'));
    });

    mocks.state = { exists: true, isActive: true };
    rerender(<Checklist title="Morning Checklist" checklistKey="k" />);

    const restoredInput = await findAddInput();
    expect(restoredInput).toHaveValue('Buy eggs');
    expect(await screen.findByText(ADD_FAILED_MESSAGE)).toBeInTheDocument();
  });

  it('keeps Enter on empty text silent', async () => {
    const user = userEvent.setup();
    renderChecklist();

    const input = await findAddInput();
    await user.click(input);
    await user.keyboard('{Enter}');

    expect(mocks.mutations.addChecklistItem).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
