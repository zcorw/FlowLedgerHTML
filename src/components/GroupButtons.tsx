import { Button, Stack } from "@mui/material";

export type GroupButtonsProps = {
  value: string | number;
  options: { label: string; value: string | number }[];
  onChange: (value: string | number) => void;
};

const btnSx = (active: boolean) => ({
  borderRadius: 999,
  px: 3,
  py: 1.2,
  fontWeight: 800,
  letterSpacing: 2,
  minWidth: 120,
  color: active ? "rgba(95,238,230,0.95)" : "rgba(255,255,255,0.80)",
  background: "rgba(0,0,0,0.18)",
  border: active
    ? "1.5px solid rgba(95,238,230,0.75)"
    : "1px solid rgba(255,255,255,0.14)",
  boxShadow: active ? "0 0 18px rgba(95,238,230,0.25)" : "none",
  "&:hover": {
    border: "1.5px solid rgba(95,238,230,0.55)",
    background: "rgba(0,0,0,0.22)",
  },
});

const GroupButtons = (_props: GroupButtonsProps) => {
  return (
    <Stack direction="row" spacing={1.5}>
      {_props.options.map((option) => (
        <Button
          key={option.value}
          onClick={() => _props.onChange(option.value)}
          sx={btnSx(option.value === _props.value)}
        >
          {option.label}
        </Button>
      ))}
    </Stack>
  );
};

export default GroupButtons;