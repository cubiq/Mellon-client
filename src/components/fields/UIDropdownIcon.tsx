import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from "@mui/material/Menu";
import { useTheme } from "@mui/material/styles";

import { FieldProps } from "../NodeContent";
import { useState } from "react";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";

const UIDropdownIcon = ({ fieldKey, style, disabled, hidden, label, options, updateStore, onChangeAction }: FieldProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const targetFields = Array.isArray(onChangeAction?.target) ? onChangeAction?.target : [onChangeAction?.target];

    const theme = useTheme();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuItemClick = (i: number) => {
        setAnchorEl(null);
        if (i<0) return;

        const targetValue = Array.isArray(options[i].value) ? options[i].value : [options[i].value];

        targetFields.forEach((k: string, i: number) => {
            updateStore?.(k, targetValue[i]);
        });
    };

    return (
        <Box data-key={fieldKey} className={`flex-auto nodrag ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`} sx={{ ...style }}>
            <IconButton
                onClick={handleClick}
                title={label}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleMenuItemClick(-1)}
                slotProps={{
                    paper: {
                        sx: {
                            maxHeight: '640px',
                            lineHeight: '0',
                            '& li:hover': {
                                backgroundColor: theme.palette.secondary.main,
                            },
                        },
                        elevation: 8,
                    },
                }}
            >
                {options.map((option: any, i: number) => (
                    option.label?.startsWith('---') ? (
                        <Divider key={i} sx={{ borderColor: 'rgba(255, 255, 255, 0.5)' }} />
                    ) : (
                        <MenuItem key={i} sx={{ lineHeight: '1.2', pl: 1, pr: 1 }} onClick={() => handleMenuItemClick(i)}>
                            {option.label}
                        </MenuItem>
                    )
                ))}
            </Menu>
        </Box>
    )
}

export default UIDropdownIcon;