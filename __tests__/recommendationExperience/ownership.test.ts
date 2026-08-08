import {
  normalizeOwnerEmail,
  resolveOwnerNamespace,
  shouldMigrateOwnerState,
} from '../../src/services/recommendationExperience/ownership';

describe('recommendation experience ownership', () => {
  it('prefers a stable backend user ID over email', () => {
    expect(
      resolveOwnerNamespace({
        backendUserId: 42,
        email: ' Mary@Example.COM ',
      }),
    ).toEqual({
      key: 'backend-user:42',
      kind: 'backendUser',
      normalizedEmail: 'mary@example.com',
    });
  });

  it('normalizes email and otherwise uses a temporary namespace', () => {
    expect(normalizeOwnerEmail(' User@Example.com ')).toBe(
      'user@example.com',
    );
    expect(resolveOwnerNamespace({ email: ' User@Example.com ' }).key).toBe(
      'email:user@example.com',
    );
    expect(resolveOwnerNamespace({}).key).toBe('temporary:current');
  });

  it('migrates only toward a more stable identity for the same user', () => {
    const temporary = resolveOwnerNamespace({});
    const email = resolveOwnerNamespace({ email: 'user@example.com' });
    const stable = resolveOwnerNamespace({
      backendUserId: '123',
      email: 'user@example.com',
    });
    const anotherStable = resolveOwnerNamespace({
      backendUserId: '999',
      email: 'other@example.com',
    });

    expect(shouldMigrateOwnerState(temporary, email)).toBe(true);
    expect(shouldMigrateOwnerState(email, stable)).toBe(true);
    expect(shouldMigrateOwnerState(email, anotherStable)).toBe(false);
    expect(shouldMigrateOwnerState(stable, email)).toBe(false);
  });
});
