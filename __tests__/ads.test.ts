import { resolveAdCreative } from '../src/data/ads';

describe('ad creative assignment', () => {
  it('splits the four ad placements evenly between both creatives', () => {
    expect(resolveAdCreative('home-to-today')).toBe('drug');
    expect(resolveAdCreative('standalone')).toBe('drug');
    expect(resolveAdCreative('today-to-baby-status')).toBe('diaper');
    expect(resolveAdCreative('profile-to-baby-twin')).toBe('diaper');
  });
});
