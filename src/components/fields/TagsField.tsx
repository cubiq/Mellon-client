import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { FieldProps } from "../NodeContent";

const TagsField = ({ fieldKey, value, style, disabled, hidden, label, no_validation, options, updateStore }: FieldProps) => {
    const tags = typeof value === 'string' ? [value] : value || [];

    return (
        <Box
            data-key={fieldKey}
            sx={{ minWidth: '320px', ...style }}
            className={`nodrag ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            <Autocomplete
                multiple
                disablePortal
                filterSelectedOptions
                handleHomeEndKeys
                freeSolo={no_validation}
                options={options}
                renderInput={(params: any) => <TextField {...params} label={label} />}
                onChange={(_, v) => updateStore?.(fieldKey, v)}
                value={tags}
                size="small"
            />
        </Box>
    )
}

export default TagsField;