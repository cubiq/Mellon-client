import { ChangeEvent, useEffect } from "react";
import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

export default function ToggleField(props: FieldProps) {
    const Component = props.fieldType === 'checkbox' ? Checkbox : Switch;

    const handleFieldsToggle = (value: boolean) => {
        if (!props.onChange) {
            return;
        }

        Object.entries(props.onChange).forEach(([key, fields]: [string, any]) => {
            if (!Array.isArray(fields)) {
                fields = [fields];
            }
            const isHidden = key !== value.toString();
            fields.forEach((field: string) => {
                props.updateStore(field, isHidden, 'hidden');
            });
        });
    }

    useEffect(() => {
        handleFieldsToggle(props.value);
    }, []);

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        props.updateStore(props.fieldKey, e.target.checked);
        handleFieldsToggle(e.target.checked);
    }

    return (
        <Box
            sx={{
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field`}
        >
            <FormControlLabel
                sx={{
                    width: '100%',
                    px: 1,
                    '& .MuiFormControlLabel-label': {
                        fontSize: '14px',
                        px: 1,
                    },
                }}
                control={<Component
                    size="small"
                    className="nodrag"
                    checked={props.value}
                    onChange={handleOnChange}
                />}
                label={props.label}
            />
        </Box>
    )
}