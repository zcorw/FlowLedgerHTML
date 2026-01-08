import { Chip, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

type OptionType = {
  label: string;
  value: string | number;
};

type Props = {
  label: string;
  options: OptionType[];
  selectedValue: string | number;
  onChange: (value: string | number) => void;
}

const ChipMenu = (_props: Props) => {
  const [ anchor, setAnchor ] = useState<null | HTMLElement>(null);

  return (
    <>
      <Chip
        label={`${_props.label}：${_props.options.find(opt => opt.value === _props.selectedValue)?.label || '全部'}`}
        variant="outlined"
        sx={{ cursor: 'pointer', userSelect: 'none', height: 40 }}
        onClick={(e) => setAnchor(e.currentTarget)}
      />
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { bgcolor: 'background.paper' } } }}
      >
        {_props.options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === _props.selectedValue}
            onClick={() => _props.onChange(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
export default ChipMenu;