
import { ReactNode } from "react";
import { FieldProps } from "../components/NodeContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

export default function UIGroupField({ props, children }: { props: FieldProps; children: ReactNode }) {
    const isCollapseField = !!props.fieldOptions?.collapse;
    const isOpen = !!props.value;
    const displayLabel = isCollapseField || !!!props.fieldOptions?.noLabel;

    return (
        <Box
            sx={{
                width: '100%',
                '& > .MuiBox-root': {
                    mb: 1,
                },
                borderBottom: !isCollapseField ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''}`}
        >
            {displayLabel && (
                <Box
                    className={`${isCollapseField ? 'nodrag' : ''}`}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: `${isCollapseField ? 'pointer' : 'default'}`,
                        '&:hover': {
                            color: `${isCollapseField ? 'primary.main' : 'inherit'}`,
                        },
                    }}
                    onClick={() => props.updateStore(props.fieldKey, !isOpen)}
                >
                    <Typography variant="body2">{props.label}</Typography>
                    {isCollapseField && (
                        <Box sx={{ lineHeight: 0, minHeight: 0 }}>
                            {isOpen ? <ExpandMoreIcon sx={{ fontSize: '18px' }} /> : <ExpandLessIcon sx={{ fontSize: '18px' }} />}
                        </Box>
                    )}
                </Box>
            )}
            {isCollapseField ? (
                <Collapse
                    in={isOpen}
                    sx={{
                        '& .MuiCollapse-wrapperInner > .MuiBox-root': {
                            mb: 1,
                        }
                    }}
                >
                    <>
                        {children}
                    </>
                </Collapse>
            ) : (
                <>
                    {children}
                </>
            )}
        </Box>
    );
};
