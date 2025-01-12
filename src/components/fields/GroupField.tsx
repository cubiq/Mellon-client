import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import NodeContent from "../NodeContent";

import { GroupProps } from "../NodeContent";
import { useTheme } from "@mui/material/styles";


const GroupField = (
    { fieldKey, label, direction, disabled, hidden, style, fields, updateStore }: GroupProps
) => {
    const alignItems = direction === 'column' ? 'stretch' : 'center';
    const spacing = direction === 'column' ? 0 : 1;

    const theme = useTheme();

    if (label) {
        return (
            <Box
                data-key={fieldKey}
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    pt: 0.5, pb: 0,
                    ...style,
                }}
                className={`labelled-group ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
            >
                <Typography sx={{ pb: 1, color: theme.palette.text.secondary, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {label}
                </Typography>
                <Stack
                    direction={direction}
                    spacing={spacing}
                    sx={{
                        '& > .MuiBox-root': { flex: "1" },
                        '& > .flex-auto': { flex: "0 0 auto" },
                        justifyContent: "space-between",
                        alignItems: alignItems,
                    }}
                >
                    <NodeContent
                        fields={fields}
                        updateStore={updateStore}
                        parentDisabled={disabled}
                    />
                </Stack>
            </Box>
        )
    }

    return (
        <Stack
            data-key={fieldKey}
            direction={direction}
            spacing={spacing}
            sx={{
                '& > .MuiBox-root': { flex: "1" },
                '& > .flex-auto': { flex: "0 0 auto" },
                justifyContent: "space-between",
                alignItems: alignItems,
                ...style,
            }}
            className={`${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            <NodeContent
                fields={fields}
                updateStore={updateStore}
                parentDisabled={disabled}
            />
        </Stack>
    )
}

export default GroupField;
