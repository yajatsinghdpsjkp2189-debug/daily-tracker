export function getStreak(completionDates: string[]): number {
  if (!completionDates.length) return 0;
  const sorted = [...completionDates].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;
  let streak = 1;
  let current = new Date(sorted[0]);
  for (let i = 1; i < sorted.length; i++) {
    const expected = new Date(current);
    expected.setDate(expected.getDate() - 1);
    const expectedStr = expected.toISOString().split("T")[0];
    if (sorted[i] === expectedStr) {
      streak++;
      current = expected;
    } else {
      break;
    }
  }
  return streak;
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function isIntervalDue(
  createdAtNs: bigint,
  intervalDays: bigint,
): boolean {
  const createdMs = Number(createdAtNs / 1_000_000n);
  const dueMs = createdMs + Number(intervalDays) * 24 * 60 * 60 * 1000;
  return dueMs <= Date.now();
}
