import { ChangeEvent, useEffect } from "react";
import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import fieldAction from "../utils/fieldAction";

export default function ToggleField(props: FieldProps) {
    const Component = props.fieldType === 'checkbox' ? Checkbox : Switch;

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        props.updateStore(props.fieldKey, e.target.checked);
        fieldAction(props, e.target.checked.toString());
    }

    useEffect(() => {
        fieldAction(props, props.value);
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