import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { FieldProps } from "../components/NodeContent";
import fieldAction from "../utils/fieldAction";
import { useEffect } from "react";

export default function RadioField(props: FieldProps) {
    const options = Array.isArray(props.options)
        ? props.options.map(value => ({ value, label: value }))
        : Object.entries(props.options).map(([key, value]) => ({ value: key, label: value }));

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.updateStore(props.fieldKey, e.target.value);
        fieldAction(props, e.target.value);
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
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field`}
        >
            <RadioGroup
                value={props.value}
                onChange={handleOnChange}
                row={props.fieldOptions?.row || false}
            >
                {options.map((option) => (
                    <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio size="small" className="nodrag" />}
                        label={option.label}
                        sx={{
                            m: 0,
                            '& .MuiRadio-root': {
                                p: 0.5,
                                mr: 0.5,
                            },
                            '& .MuiFormControlLabel-label': {
                                fontSize: 14,
                                p: 0,
                                m: 0,
                                mr: 0.5
                            },
                        }}
                    />
                ))}
            </RadioGroup>
        </Box>
    )
}