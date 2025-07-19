import { ChangeEvent, useEffect } from "react";
import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import runFieldAction from "../utils/runFieldAction";

export default function ToggleField(props: FieldProps) {
    const Component = props.fieldType === 'checkbox' ? Checkbox : Switch;

    const fieldsToggle = async (value: boolean) => {
        if (!props.onChange) {
            return;
        }

        if (typeof props.onChange === 'string') {
            props.updateStore(props.fieldKey, true, 'disabled');
            try {
                await runFieldAction(props.nodeId, props.module, props.action, props.onChange, props.fieldKey, props.fieldOptions?.queue || false);
            } catch (error) {
                props.updateStore(props.fieldKey, false, 'disabled');
            } finally {
                if (!props.fieldOptions?.queue) {
                    props.updateStore(props.fieldKey, false, 'disabled');
                }
            }
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
        fieldsToggle(props.value);
    }, []);

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        props.updateStore(props.fieldKey, e.target.checked);
        fieldsToggle(e.target.checked);
    }

    return (
        <Box
            sx={{
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} ${props.disabled ? 'mellon-disabled' : ''} mellon-field`}
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