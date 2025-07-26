import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";

export default function RangeField(props: FieldProps) {
    return (
        <Box
            sx={{
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field`}
        >
            <Box sx={{ width: '100%', display: 'flex', position: 'relative', alignItems: 'center', justifyContent: 'space-between' }}>
                {Array.isArray(props.value) && props.value.length && <Typography sx={{ fontSize: 13, lineHeight: 1, bgcolor: 'background.default', px: 0.75, py: 0.5, borderRadius: 0.5 }}>{props.value[0]}</Typography>}
                <Typography sx={{ fontSize: 13, lineHeight: 1, color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', px: 0.75, py: 0.5, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>{props.label}</Typography>
                <Typography sx={{ fontSize: 13, lineHeight: 1, bgcolor: 'background.default', px: 0.75, py: 0.5, borderRadius: 0.5 }}>{Array.isArray(props.value) && props.value.length ? props.value[1] : props.value}</Typography>
            </Box>
            <Box sx={{ px: 1.5 }}>
                <Slider
                    className="nodrag"
                    disabled={props.disabled}
                    value={props.value}
                    onChange={(_, value) => props.updateStore(props.fieldKey, value)}
                    min={props.min}
                    max={props.max}
                    step={props.step}
                    marks={props.fieldOptions?.marks || false}
                    valueLabelDisplay={props.fieldOptions?.marks || 'off'}
                    size="small"
                    sx={{
                        '& .MuiSlider-markLabel': {
                            fontSize: 13,
                            minHeight: 0,
                            mt: -0.5
                        },
                        '& .MuiSlider-thumb': {
                            width: 14,
                            height: 14,
                        },
                        '& .MuiSlider-valueLabel': {
                            bgcolor: 'secondary.main',
                            px: 0.75, py: 0.5,
                            borderRadius: 0.5,
                            lineHeight: 1,
                        },
                    }}
                />
            </Box>
        </Box>
    );
}