import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import { FieldProps } from "../NodeContent";
import { useEffect } from "react";

const ToggleField = ({ fieldType, fieldKey, label, style, disabled, hidden, value, updateStore, onChangeAction }: FieldProps) => {
    const MuiSwitch = fieldType === 'switch' ? Switch : Checkbox;

    const handleDisableAction = (value: boolean, target: any) => {
        const onTrueTargets = Array.isArray(target.true) ? target.true : [target.true];
        const onFalseTargets = Array.isArray(target.false) ? target.false : [target.false];

        onTrueTargets.forEach((field: string) => {
            if (field.endsWith('_group')) {
                updateStore?.(field, { disabled: value }, 'group');
            } else {
                updateStore?.(field, value, 'disabled');
            }
        });
        onFalseTargets.forEach((field: string) => {
            if (field.endsWith('_group')) {
                updateStore?.(field, { disabled: !value }, 'group');
            } else {
                updateStore?.(field, !value, 'disabled');
            }
        });
    };

    useEffect(() => {
        if (onChangeAction?.action === 'disable') {
            handleDisableAction(value, onChangeAction.target);
        }
    }, [value]);

    return (
        <Box
            data-key={fieldKey}
            className={`${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
            sx={{ ...style }}
        >
            <FormGroup>
                <FormControlLabel
                    sx={{ m: 0, p: 0 }}
                    control={<MuiSwitch
                        sx={{ mr: 0.5 }}
                        size="small"
                        color="secondary"
                        className="nodrag"
                        checked={value}
                        onChange={(e) => updateStore?.(fieldKey, e.target.checked)}
                    />}
                    label={label}
                />
            </FormGroup>
        </Box>
    );
};


export default ToggleField;
