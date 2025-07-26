import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function UILabelField(props: FieldProps) {
    return (
        <Box
            sx={{
                width: '100%',
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''}`}
        >
            <Typography sx={{ fontSize: 13, lineHeight: 1, color: 'text.primary', ...props.style}}>{props.value}</Typography>
        </Box>
    );
}