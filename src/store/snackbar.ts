import { create } from 'zustand';

type Severity = 'success' | 'info' | 'warning' | 'error';

type SnackbarState = {
  open: boolean;
  message: string;
  severity: Severity;
  duration: number;
  show: (message: string, options?: { severity?: Severity; duration?: number }) => void;
  hide: () => void;
};

const useSnackbarStore = create<SnackbarState>((set) => ({
  open: false,
  message: '',
  severity: 'info',
  duration: 4000,
  show: (message, options) =>
    set(() => ({
      open: true,
      message,
      severity: options?.severity ?? 'info',
      duration: options?.duration ?? 4000,
    })),
  hide: () => set(() => ({ open: false })),
}));

export const enqueueSnackbar = (
  message: string,
  options?: { severity?: Severity; duration?: number }
) => useSnackbarStore.getState().show(message, options);

export const closeSnackbar = () => useSnackbarStore.getState().hide();

export default useSnackbarStore;
