export interface ConnectionIssuePresentationState {
  incidentActive: boolean;
  visible: boolean;
}

export type ConnectionIssuePresentationAction =
  | {
      type: 'refreshFinished';
      hasIssue: boolean;
    }
  | { type: 'dismissed' };

export const initialConnectionIssuePresentationState: ConnectionIssuePresentationState = {
  incidentActive: false,
  visible: false,
};

export const connectionIssuePresentationReducer = (
  state: ConnectionIssuePresentationState,
  action: ConnectionIssuePresentationAction,
): ConnectionIssuePresentationState => {
  if (action.type === 'dismissed') {
    return state.visible ? { ...state, visible: false } : state;
  }

  if (!action.hasIssue) {
    return state.incidentActive || state.visible
      ? initialConnectionIssuePresentationState
      : state;
  }

  if (state.incidentActive) {
    return state;
  }

  return {
    incidentActive: true,
    visible: true,
  };
};
