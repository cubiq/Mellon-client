import Box from "@mui/material/Box"
import Slider from "@mui/material/Slider"
import Typography from "@mui/material/Typography"
import { FieldProps } from "../NodeContent"
import { useTheme } from "@mui/material/styles"

const RangeField = ({ fieldKey, value, style, disabled, hidden, label, min, max, step, updateStore }: FieldProps) => {
    const theme = useTheme();

    return (
        <Box
            key={fieldKey}
            data-key={fieldKey}
            sx={{ pt: 0, pb: 1, pl: 1, pr: 1, ...style }}
            className={`nodrag ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}>
            <Typography gutterBottom>{label}</Typography>
            <Slider
                value={value || [0, 1]}
                onChange={(_, newValue) => updateStore?.(fieldKey, newValue)}
                min={min || 0}
                max={max || 1}
                step={step || 0.01}
                valueLabelDisplay="auto"
                color="secondary"
                disableSwap
                sx={{
                    '& .MuiSlider-thumb': {
                        color: theme.palette.secondary.main,
                    },
                }}
            />
        </Box>
    )
}

export default RangeField;