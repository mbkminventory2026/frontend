// Self-check for date logic. Run: npx tsx src/lib/dateGrid.check.ts
import assert from 'node:assert';
import { toISO, fromISO, buildMonthGrid } from './dateGrid';

// toISO uses LOCAL date parts — no UTC off-by-one
assert.equal(toISO(new Date(2026, 5, 27)), '2026-06-27');
// round-trip incl. leap day
assert.equal(toISO(fromISO('2024-02-29')!), '2024-02-29');
// bad input -> null (so payload never gets garbage)
assert.equal(fromISO(''), null);
assert.equal(fromISO('not-a-date'), null);
// grid: 42 cells, starts on Sunday, contains the 1st of the month
const grid = buildMonthGrid(new Date(2026, 5, 15));
assert.equal(grid.length, 42);
assert.equal(grid[0].getDay(), 0);
assert.ok(grid.some((d) => d.getMonth() === 5 && d.getDate() === 1));

console.log('dateGrid OK');
