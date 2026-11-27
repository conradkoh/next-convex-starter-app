import { ErrorScenario, type ErrorScenarioMode } from './ErrorScenario';

const MODES: readonly ErrorScenarioMode[] = ['render', 'auth', 'forbidden', 'region', 'screen'];

export default async function TestErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const selected = MODES.find((m) => m === mode) ?? null;
  return <ErrorScenario mode={selected} />;
}
