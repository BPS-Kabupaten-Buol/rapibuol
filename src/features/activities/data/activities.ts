import { faker } from '@faker-js/faker'

// Set a fixed seed for consistent data generation
faker.seed(12345)

export const activities = Array.from({ length: 100 }, () => {
  return {
    id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
    description: faker.lorem.sentence({ min: 5, max: 15 }),
    date: faker.date.recent(),
    start_time: '08:00',
    end_time: '16:00',
    volume: faker.number.int({ min: 1, max: 100 }),
    unit: faker.number.int({ min: 1, max: 6 }), // mapped to 1-6 in data.tsx
    assignor: faker.number.int({ min: 1, max: 6 }), // mapped to 1-6 in data.tsx
    is_done: faker.datatype.boolean(),
  }
})
