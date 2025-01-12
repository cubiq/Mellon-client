import { useEffect } from "react";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import { FieldProps } from "../NodeContent";
import { useTheme } from "@mui/material/styles";

import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const IconToggleField = ({ fieldKey, value, style, disabled, hidden, label, icon, onChangeAction, updateStore }: FieldProps) => {
    const theme = useTheme();

    const iconsMap = {
        'random': <AutoFixHighIcon />,
    }

    const MuiIcons = {
        icon: iconsMap[icon as keyof typeof iconsMap],
        checkedIcon: iconsMap[icon as keyof typeof iconsMap],
    }

    const handleDisableAction = (value: boolean, target: any) => {
        const onTrueTargets = Array.isArray(target.true) ? target.true : [target.true];
        const onFalseTargets = Array.isArray(target.false) ? target.false : [target.false];

        onTrueTargets.forEach((field: string) => {
            updateStore?.(field, value, 'disabled');
        });
        onFalseTargets.forEach((field: string) => {
            updateStore?.(field, !value, 'disabled');
        });
    };

    useEffect(() => {
        if (onChangeAction && onChangeAction.action === 'disable') {
            handleDisableAction(value, onChangeAction.target);
        }
    }, [value]);

    return (
        <Box
            data-key={fieldKey}
            className={`flex-auto nodrag ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
            sx={{ ...style }}
        >
            <Checkbox
                size="small"
                {...MuiIcons}
                checked={value}
                title={label}
                onChange={(e) => updateStore?.(fieldKey, e.target.checked)}
                disableRipple
                sx={{
                    p: 1.1,
                    m: 0,
                    border: 1,
                    borderRadius: 1,
                    borderColor: "rgba(255,255,255,0.25)",
                    '&.Mui-checked': {
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.background.paper,
                        borderColor: theme.palette.secondary.main,
                    }
                }}
            />
        </Box>
    )
}

export default IconToggleField;