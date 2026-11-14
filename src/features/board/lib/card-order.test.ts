import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Activity } from '@/features/activities/data/schema'
import { moveBoardCard, parseBoardCardOrder } from './card-order.ts'
import { groupActivitiesIntoQuadrants } from './group-activities-into-quadrants.ts'

function activity(
  id: number,
  date: string,
  quadrant: Activity['quadrant'] = 'do-first',
  isDone = false
): Activity {
  return {
    id,
    date,
    quadrant,
    is_done: isDone,
    description: `Aktivitas uji ${id}`,
    user_id: 'test-user',
    created_at: date,
    updated_at: null,
    end_date: null,
    start_time: null,
    end_time: null,
    volume: null,
    unit: null,
    assignor: null,
    link_bukti_dukung: null,
    coordinates: null,
  }
}

test('move cards up, down, to the end, and into an empty column', () => {
  const order = [1, 2, 3]
  assert.deepEqual(moveBoardCard(order, 3, 1), [3, 1, 2])
  assert.deepEqual(moveBoardCard(order, 1, 3), [2, 1, 3])
  assert.deepEqual(moveBoardCard(order, 1, null), [2, 3, 1])
  assert.deepEqual(moveBoardCard([], 4, null), [4])
  assert.deepEqual(moveBoardCard(order, 2, 2), order)
  assert.deepEqual(moveBoardCard(order, 2, 99), [1, 3, 2])
  assert.deepEqual(order, [1, 2, 3])
})

test('ignore malformed saved order and remove duplicates', () => {
  for (const value of [
    null,
    'invalid',
    '{}',
    '["1"]',
    '[null]',
    '[-1]',
    '[1.5]',
  ]) {
    assert.deepEqual(parseBoardCardOrder(value), [])
  }
  assert.deepEqual(parseBoardCardOrder('[3,1,3,2]'), [3, 1, 2])
})

test('preserve custom order, new cards, old quadrants, and completed date order', () => {
  const activities = [
    activity(1, '2026-11-01'),
    activity(2, '2026-11-02'),
    activity(3, '2026-10-01'),
    activity(4, '2026-11-04', null),
    activity(5, '2026-11-01', 'schedule'),
    activity(6, '2026-11-01', 'do-first', true),
    activity(7, '2026-11-02', 'schedule', true),
  ]
  const { columns, done } = groupActivitiesIntoQuadrants(
    activities,
    [2, 99, 1, 6, 7]
  )
  assert.deepEqual(
    columns[0].activities.map((item) => item.id),
    [2, 1, 3, 4]
  )
  assert.deepEqual(
    columns[1].activities.map((item) => item.id),
    [5]
  )
  assert.deepEqual(
    done.map((item) => item.id),
    [7, 6]
  )
  assert.deepEqual(
    activities.map((item) => item.id),
    [1, 2, 3, 4, 5, 6, 7]
  )
})

test('place a moved card between cards in another column without reordering its peers', () => {
  const activities = [
    activity(1, '2026-11-01'),
    activity(2, '2026-11-02', 'schedule'),
    activity(3, '2026-11-03', 'schedule'),
  ]
  const order = moveBoardCard([1, 2, 3], 1, 3)
  const moved = activities.map((item) =>
    item.id === 1 ? { ...item, quadrant: 'schedule' as const } : item
  )
  const { columns } = groupActivitiesIntoQuadrants(moved, order)
  assert.deepEqual(columns[0].activities, [])
  assert.deepEqual(
    columns[1].activities.map((item) => item.id),
    [2, 1, 3]
  )
})
