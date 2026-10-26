import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_RAW } from '../features/bundle/bundle.defaults';
import { calculateBundle, hasDeficit } from '../features/bundle/bundle.calculator';
import { validateInputs } from '../features/bundle/bundle.validation';
import {
  buildScenarios,
  collectAgentOffers,
  defaultScenarioParams,
  type ScenarioParams,
} from '../features/bundle/bundle.presets';
import { buildExecutiveSummary } from '../features/bundle/bundle.summary';
import type { FieldKey, ModelStatus, RawInputs } from '../features/bundle/bundle.types';

/**
 * تنها نقطه اتصال UI به منطق مالی. هیچ فرمولی اینجا نیست؛ فقط ترکیب توابع
 * bundle.* و نگه‌داری وضعیت. همه خروجی‌ها از روی ورودی‌های جاری و بلافاصله محاسبه می‌شوند.
 */
export function useBundleModel() {
  const [raw, setRaw] = useState<RawInputs>(DEFAULT_RAW);
  const [scenarioParams, setScenarioParams] = useState<Record<string, ScenarioParams>>(() =>
    defaultScenarioParams(),
  );

  const outcome = useMemo(() => validateInputs(raw), [raw]);
  const result = useMemo(
    () => (outcome.inputs ? calculateBundle(outcome.inputs) : null),
    [outcome],
  );
  const status: ModelStatus = !outcome.inputs || !result
    ? 'invalid'
    : hasDeficit(result)
      ? 'deficit'
      : 'valid';

  const current = useMemo(
    () => (outcome.inputs && result ? { inputs: outcome.inputs, result } : null),
    [outcome, result],
  );
  const scenarios = useMemo(() => buildScenarios(raw, scenarioParams), [raw, scenarioParams]);
  const agentOffers = useMemo(() => collectAgentOffers(current, scenarios), [current, scenarios]);
  const summary = useMemo(
    () => (current ? buildExecutiveSummary(current.inputs, current.result, status) : []),
    [current, status],
  );

  const setField = useCallback((key: FieldKey, value: string) => {
    setRaw((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setScenarioParam = useCallback((id: string, patch: Partial<ScenarioParams>) => {
    setScenarioParams((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { cashShare: '', posTarget: '' }), ...patch },
    }));
  }, []);

  const reset = useCallback(() => {
    setRaw(DEFAULT_RAW);
    setScenarioParams(defaultScenarioParams());
  }, []);

  return {
    raw,
    outcome,
    current,
    result,
    status,
    scenarios,
    scenarioParams,
    agentOffers,
    summary,
    setField,
    setScenarioParam,
    reset,
  };
}

export type BundleModel = ReturnType<typeof useBundleModel>;
