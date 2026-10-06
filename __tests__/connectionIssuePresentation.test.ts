import {
  connectionIssuePresentationReducer,
  initialConnectionIssuePresentationState,
} from '../src/utils/connectionIssuePresentation';

describe('connection issue presentation', () => {
  it('presents a connection incident only once until a successful refresh', () => {
    const detected = connectionIssuePresentationReducer(
      initialConnectionIssuePresentationState,
      { type: 'refreshFinished', hasIssue: true },
    );
    const dismissed = connectionIssuePresentationReducer(detected, {
      type: 'dismissed',
    });

    expect(detected).toEqual({ incidentActive: true, visible: true });
    expect(dismissed).toEqual({ incidentActive: true, visible: false });
    expect(
      connectionIssuePresentationReducer(dismissed, {
        type: 'refreshFinished',
        hasIssue: true,
      }),
    ).toBe(dismissed);
  });

  it('keeps an open incident stable across failed retries', () => {
    const detected = connectionIssuePresentationReducer(
      initialConnectionIssuePresentationState,
      { type: 'refreshFinished', hasIssue: true },
    );

    expect(
      connectionIssuePresentationReducer(detected, {
        type: 'refreshFinished',
        hasIssue: true,
      }),
    ).toBe(detected);
  });

  it('resets after success so a later incident can be presented', () => {
    const detected = connectionIssuePresentationReducer(
      initialConnectionIssuePresentationState,
      { type: 'refreshFinished', hasIssue: true },
    );
    const recovered = connectionIssuePresentationReducer(detected, {
      type: 'refreshFinished',
      hasIssue: false,
    });

    expect(recovered).toBe(initialConnectionIssuePresentationState);
    expect(
      connectionIssuePresentationReducer(recovered, {
        type: 'refreshFinished',
        hasIssue: true,
      }),
    ).toEqual({ incidentActive: true, visible: true });
  });
});
