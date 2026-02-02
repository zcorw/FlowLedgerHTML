import { useCallback, useEffect, useMemo, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { listInstitutions, type Institution } from "@/api/deposits";

type Props = {
  value: number | null | undefined;
  onChange: (id: number | null, institution?: Institution | null) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  pageSize?: number;
};

const defaultLabel = "所属机构";

const InstitutionSelect = ({
  value,
  onChange,
  label = defaultLabel,
  required,
  error,
  helperText,
  disabled,
  pageSize = 20,
}: Props) => {
  const [options, setOptions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const selectedOption = useMemo(
    () => options.find((item) => item.id == value) ?? null,
    [options, value],
  );

  const fetchInstitutions = useCallback(
    async (keyword?: string) => {
      setLoading(true);
      try {
        const res = await listInstitutions({
          name: keyword?.trim() || undefined,
          page: 1,
          page_size: pageSize,
        });
        setOptions(res.data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("获取机构列表失败", error);
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    const keyword = inputValue.trim();
    const handler = setTimeout(() => {
      fetchInstitutions(keyword || undefined);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchInstitutions, inputValue]);

  return (
    <Autocomplete
      options={options}
      value={selectedOption}
      loading={loading}
      fullWidth
      filterOptions={(items) => items}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id == value.id}
      onChange={(_, option) => onChange(option?.id ?? null, option ?? null)}
      inputValue={inputValue}
      onInputChange={(_, nextInput) => setInputValue(nextInput)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default InstitutionSelect;
