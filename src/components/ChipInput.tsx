import { Chip, TextField } from '@mui/material';
import { useState } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const ChipInput = (_props: Props) => {
  const [inputValue, setInputValue] = useState(_props.value);
  const [show, setShow] = useState<boolean>(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      _props.onChange(inputValue);
      setShow(false);
    }
  };

  const handleBlur = () => {
    _props.onChange(inputValue);
    setShow(false);
  }

  return (
    <>
      {!show && <Chip
        label={`${_props.label}${inputValue ? `：${inputValue}` : ''}`}
        variant="outlined"
        onClick={(e) => setShow(true)}
        sx={{ cursor: 'pointer', userSelect: 'none', height: 40 }}
      />}
      {show && <TextField
        label={_props.label}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleEnter}
        onBlur={handleBlur}
        size="small"
      />}
    </>
  );
};

export default ChipInput;