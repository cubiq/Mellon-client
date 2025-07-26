import { ChangeEvent, useEffect } from "react";
import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import fieldAction from "../utils/fieldAction";
import Typography from "@mui/material/Typography";

export default function ToggleField(props: FieldProps) {
    const Component = props.fieldType === 'checkbox' ? Checkbox : Switch;

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>, key?: string) => {
        if (options) {
            const newValue = e.target.checked ? [...props.value, key] : props.value.filter((k: string) => k !== key);
            props.updateStore(props.fieldKey, newValue);
            fieldAction(props, newValue);
        } else {
            props.updateStore(props.fieldKey, e.target.checked);
            fieldAction(props, e.target.checked.toString());
        }
    }

    const options = !Array.isArray(props.options) && typeof props.options === 'object' ? Object.entries(props.options).map(([key, value]) => (
        <FormControlLabel
            key={key}
            sx={{
                '& .MuiFormControlLabel-label': {
                    fontSize: '14px',
                    pl: 0, pr: 0.5,
                },
            }}
            control={<Component
                size="small"
                className="nodrag"
                checked={props.value.includes(key)}
                onChange={(e) => handleOnChange(e, key)}
                sx={{
                    minHeight: 0,
                    lineHeight: 0,
                }}
                slotProps={{
                    input: {
                        sx: {
                            minHeight: 0,
                            lineHeight: 0,
                            p: 0,
                            m: 0,
                        }
                    }
                }}
            />}
            label={value}
        />
    )) : null;

    useEffect(() => {
        if (options) {
            fieldAction(props, props.value);
        } else {
            fieldAction(props, props.value.toString());
        }
    }, []);

    return (
        <Box
            sx={{
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} ${props.disabled ? 'mellon-disabled' : ''} mellon-field`}
        >
            {!options ? (
                <FormControlLabel
                    sx={{
                        width: '100%',
                        px: 1,
                        '& .MuiFormControlLabel-label': {
                            fontSize: '14px',
                            px: 0.5,
                        },
                    }}
                    control={<Component
                        size="small"
                        className="nodrag"
                        checked={props.value}
                        onChange={(e) => handleOnChange(e)}
                    />}
                    label={props.label}
                />
            ) : (
                <>
                    <Box>
                        <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.secondary' }}>{props.label}</Typography>
                    </Box>
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: props.fieldOptions?.direction || 'row', gap: 0, flexWrap: 'wrap', p: 0.5 }}>
                        {options}
                    </Box>
                </>
            )}
        </Box>
    )
}