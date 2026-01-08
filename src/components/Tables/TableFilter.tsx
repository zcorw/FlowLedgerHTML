import { Card, CardContent, Stack, TextField } from "@mui/material";
import ChipMenu from "../ChipMenu";
import ChipInput from "../ChipInput";

export type FilterItem = {
  key: string;
  label: string;
  type: 'menu' | 'input';
  options?: { label: string; value: string | number }[]; // for type 'menu'
}

type Props = {
  filters: FilterItem[];
  values: { [key: string]: string | number };
  onChange: (key: string, value: string | number) => void;
}

const TableFilter = (_props: Props) => {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2}>
          {/* Render filter items here */}
          {
            _props.filters.map((filter) => {
              if (filter.type === 'menu' && filter.options) {
                return (
                  <ChipMenu
                    key={filter.key}
                    label={filter.label}
                    options={filter.options}
                    selectedValue={_props.values[filter.key]}
                    onChange={(value) => _props.onChange(filter.key, value)}
                  />
                );
              } else if (filter.type === 'input') {
                return (
                  <ChipInput
                    key={filter.key}
                    label={filter.label}
                    value={_props.values[filter.key] as string}
                    onChange={(v) => _props.onChange(filter.key, v)}
                  />
                );
              }
            })
          }
        </Stack>
      </CardContent>
    </Card>
  );
}

export default TableFilter;