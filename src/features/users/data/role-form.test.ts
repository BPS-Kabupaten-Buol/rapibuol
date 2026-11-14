import { createFormControl } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { editUserRoleSchema, type EditUserRoleForm } from './schema.ts'

test('role form submits the current selections after additions and removals', async () => {
  const form = createFormControl<EditUserRoleForm>({
    resolver: zodResolver(editUserRoleSchema),
    defaultValues: { roleIds: [1], teamIds: [10] },
  })
  const unsubscribe = form.subscribe({
    formState: { values: true },
    callback: () => {},
  })
  try {
    form.setValue('roleIds', [1, 2])
    form.setValue('teamIds', [10, 20])
    form.setValue('roleIds', [2])
    form.setValue('teamIds', [])
    let submitted: EditUserRoleForm | undefined
    await form.handleSubmit((data) => {
      submitted = data
    })()
    assert.deepEqual(submitted, { roleIds: [2], teamIds: [] })
  } finally {
    unsubscribe()
  }
})

test('role schema rejects invalid IDs and malformed selection lists', () => {
  assert.equal(
    editUserRoleSchema.safeParse({ roleIds: ['invalid'], teamIds: [] }).success,
    false
  )
  assert.equal(
    editUserRoleSchema.safeParse({ roleIds: [1], teamIds: 'invalid' }).success,
    false
  )
  assert.equal(
    editUserRoleSchema.safeParse({ roleIds: [], teamIds: [] }).success,
    true
  )
})
