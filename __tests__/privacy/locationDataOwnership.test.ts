import { resolveLocationOwnerKeys } from '../../src/services/privacy/LocationDataOwnership';

describe('location data ownership', () => {
  it('creates stable opaque keys without storing the raw account identifiers', () => {
    const first = resolveLocationOwnerKeys({
      backendUserId: '42',
      email: ' Person@Example.com ',
    });
    const second = resolveLocationOwnerKeys({
      backendUserId: 42,
      email: 'person@example.com',
    });

    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(first.every(key => key.startsWith('owner:v1:'))).toBe(true);
    expect(first.join(' ')).not.toContain('42');
    expect(first.join(' ')).not.toContain('person@example.com');
  });

  it('does not create an owner for an unidentified session', () => {
    expect(resolveLocationOwnerKeys({})).toEqual([]);
  });
});
