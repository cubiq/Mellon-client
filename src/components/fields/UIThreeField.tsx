// TODO: NOT WORKING, need to find a better way to transmit data to a three.js viewer

import { lazy } from "react";
const ThreePreview = lazy(() => import('./UIThreePreview'));

import { FieldProps } from "../NodeContent";
import Box from "@mui/material/Box";

const UIThreeFields = ({ fieldKey, value, style, disabled, hidden }: FieldProps) => {
    return (
        <Box
            sx={{ p: 0, m: 0, mt: 1, mb: 1, ...style }}
            className={`nodrag nowheel ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            <ThreePreview nodeId="test" dataKey={fieldKey} value={value} />
        </Box>
    );
};

export default UIThreeFields;