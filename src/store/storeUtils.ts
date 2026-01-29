import useAuthStore, { selectIsAuthenticated } from './auth';

type AuthSubscriptionOptions = {
  onAuthenticated: (force?: boolean) => void;
  onUnauthenticated: () => void;
};

export const setupAuthSubscription = ({
  onAuthenticated,
  onUnauthenticated,
}: AuthSubscriptionOptions) => {
  const initialAuth = selectIsAuthenticated(useAuthStore.getState());
  if (initialAuth) {
    onAuthenticated(false);
  }

  return useAuthStore.subscribe((state, prev) => {
    const isAuthed = selectIsAuthenticated(state);
    const wasAuthed = selectIsAuthenticated(prev);
    if (isAuthed && !wasAuthed) {
      onAuthenticated(true);
    }
    if (!isAuthed && wasAuthed) {
      onUnauthenticated();
    }
  });
};
