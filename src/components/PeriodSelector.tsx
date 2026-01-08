import {
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useState } from 'react';

type PeriodType = {
  label: string;
  value: string;
}
type Props = {
  periods: PeriodType[];
  value: string;
  onChange: (value: string) => void;
}

const PeriodSelector = ({ periods = [], onChange, value }: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const current = periods.find(p => p.value === value);

  return (
    <>
      <Chip
        label={current?.label}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        deleteIcon={<ArrowDropDownIcon />}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {periods.map((p) => (
          <MenuItem
            key={p.value}
            selected={p.value === value}
            onClick={() => {
              onChange(p.value);
              setAnchorEl(null);
            }}
          >
            {p.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default PeriodSelector;