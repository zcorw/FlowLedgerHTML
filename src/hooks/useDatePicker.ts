import { useRef } from "react";

const useDatePicker = (initialDate: Date | null = null) => {
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
    }
  };

  return [dateInputRef, openDatePicker] as const;
};

export default useDatePicker;