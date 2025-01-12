import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { FieldProps } from "../NodeContent";

const AutocompleteField = ({ fieldKey, value, style, disabled, hidden, label, no_validation, options, updateStore }: FieldProps) => {
    return (
        <Box
            data-key={fieldKey}
            sx={{ minWidth: '320px', ...style }}
            className={`nodrag nowheel ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            <Autocomplete
                disablePortal
                freeSolo={no_validation}
                options={options}
                renderInput={(params: any) => <TextField {...params} label={label} />}
                onChange={(_, value) => updateStore?.(fieldKey, value)}
                value={value}
                size="small"
                sx={{ '& + .MuiAutocomplete-popper .MuiAutocomplete-option': { fontSize: '12px' } }}
            />
        </Box>
    );
}

export default AutocompleteField;