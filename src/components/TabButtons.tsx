import { Box, Button } from "@mui/material";

export type TabButtonsProps = {
  value: string | number;
  options: { label: string; value: string | number }[];
  onChange: (value: string | number) => void;
};

const pillShellSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  p: 0.5,
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  backdropFilter: "blur(8px)",
} as const;

const pillBtnSx = (active: boolean) => ({
  borderRadius: 999,
  px: 3,
  py: 1.2,
  fontWeight: 700,
  letterSpacing: 1,
  color: active ? "rgba(0,0,0,0.85)" : "#94a3b8",
  background: active ? "rgba(95, 238, 230, 0.95)" : "rgba(255,255,255,0.92)",
  boxShadow: active
    ? "0 0 0 1px rgba(95,238,230,0.35), 0 10px 28px rgba(95,238,230,0.35)"
    : "none",
  "&:hover": {
    background: active ? "rgba(95, 238, 230, 1)" : "rgba(255,255,255,0.98)",
  },
});

const TabButtons = (_props: TabButtonsProps) => {
  return (
    <Box sx={pillShellSx}>
      {_props.options.map((option) => (
        <Button
          key={option.value}
          disableElevation
          onClick={() => _props.onChange(option.value)}
          sx={pillBtnSx(option.value === _props.value)}
          size="small"
        >
          {option.label}
        </Button>
      ))}
    </Box>
  );
};

export default TabButtons;