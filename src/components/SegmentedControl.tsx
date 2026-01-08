import { ToggleButtonGroup, ToggleButton } from "@mui/material";

type Props = {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
};

const SegmentedControl = ({
  options,
  value,
  onChange,
}: Props) => {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(e, value) => onChange(value)}
      sx={{
        p: 0.5,
        gap: 1,
      }}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          sx={{
            borderRadius: 999,
            px: 3,
            border: 'none',
            color: 'rgba(255,255,255,0.8)',
            '&.Mui-selected': {
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#64d8ce',
              boxShadow: '0 0 0 1px #64d8ce inset',
            },
            '&.MuiToggleButtonGroup-firstButton, &.MuiToggleButtonGroup-middleButton, &.MuiToggleButtonGroup-lastButton': {
              borderRadius: 999,
            },
          }}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default SegmentedControl;