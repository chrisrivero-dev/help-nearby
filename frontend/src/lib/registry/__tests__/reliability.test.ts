/**
 * @jest-environment node
 */
import {
  reliableRun,
  CircuitOpenError,
  _resetReliability,
} from '../reliability';

beforeEach(() => _resetReliability());

const row = (id: string) => ({ id });

describe('reliableRun — cache', () => {
  it('serves a cache hit without re-running', async () => {
    let calls = 0;
    const run = reliableRun(
      async () => {
        calls++;
        return [calls];
      },
      { cacheKeyFor: () => 'k', ttlSecondsFor: () => 60 },
    );
    const a = await run(row('s'));
    const b = await run(row('s'));
    expect(a).toEqual([1]);
    expect(b).toEqual([1]); // cached
    expect(calls).toBe(1);
  });

  it('does not cache when no cacheKey is given', async () => {
    let calls = 0;
    const run = reliableRun(async () => {
      calls++;
      return [calls];
    });
    await run(row('s'));
    await run(row('s'));
    expect(calls).toBe(2);
  });
});

describe('reliableRun — circuit breaker', () => {
  it('opens after the failure threshold, then skips with CircuitOpenError', async () => {
    let attempts = 0;
    const run = reliableRun(
      async () => {
        attempts++;
        throw new Error('upstream down');
      },
      { breaker: { failureThreshold: 3, cooldownMs: 10_000 } },
    );

    // 3 real attempts fail and trip the breaker.
    for (let i = 0; i < 3; i++) {
      await expect(run(row('flaky'))).rejects.toThrow('upstream down');
    }
    expect(attempts).toBe(3);

    // 4th is short-circuited — no new attempt, distinct error type.
    await expect(run(row('flaky'))).rejects.toBeInstanceOf(CircuitOpenError);
    expect(attempts).toBe(3);
  });

  it('half-opens after cooldown and recovers on success', async () => {
    let mode: 'fail' | 'ok' = 'fail';
    const run = reliableRun(
      async () => {
        if (mode === 'fail') throw new Error('down');
        return ['ok'];
      },
      { breaker: { failureThreshold: 2, cooldownMs: 5_000 } },
    );

    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    await expect(run(row('x'))).rejects.toThrow('down');
    await expect(run(row('x'))).rejects.toThrow('down'); // opens

    // Still in cooldown → skipped.
    now.mockReturnValue(3_000);
    await expect(run(row('x'))).rejects.toBeInstanceOf(CircuitOpenError);

    // After cooldown → half-open retry; upstream now healthy.
    mode = 'ok';
    now.mockReturnValue(7_000);
    await expect(run(row('x'))).resolves.toEqual(['ok']);

    now.mockRestore();
  });

  it('isolates breakers per source id', async () => {
    const run = reliableRun(
      async (r: { id: string }) => {
        if (r.id === 'bad') throw new Error('down');
        return [r.id];
      },
      { breaker: { failureThreshold: 1, cooldownMs: 10_000 } },
    );
    await expect(run(row('bad'))).rejects.toThrow('down'); // opens 'bad'
    await expect(run(row('bad'))).rejects.toBeInstanceOf(CircuitOpenError);
    await expect(run(row('good'))).resolves.toEqual(['good']); // unaffected
  });
});
