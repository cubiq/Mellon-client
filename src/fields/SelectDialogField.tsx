import { useMemo, useState } from "react";
import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import LaunchSharpIcon from '@mui/icons-material/LaunchSharp';
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import OutlinedInput from "@mui/material/OutlinedInput";

export default function SelectDialogField(props: FieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [optionFilter, setOptionFilter] = useState("");
    const [showSuggestedValues, setShowSuggestedValues] = useState(false);

    const selectedValues = props.value || [];

    const normalizedOptions = useMemo(() => {
        if (Array.isArray(props.options)) {
            return (props.options || []).filter(Boolean).map((opt: string) => ({ id: opt, label: opt }));
        }
        if (typeof props.options === 'object' && props.options !== null) {
            return Object.entries(props.options).map(([id, label]) => ({ id, label: label as string }));
        }
        return [];
    }, [props.options]);

    const optionCount = normalizedOptions.length;
    const suggestedValues = props.fieldOptions?.suggested || [];

    const filteredOptions = useMemo(() => {
        let options = normalizedOptions;
        if (showSuggestedValues && suggestedValues.length > 0) {
            options = options.filter((option) => suggestedValues.includes(option.id));
        }
        return options.filter((option) =>
            option.label.toLowerCase().includes(optionFilter.toLowerCase())
        );
    }, [normalizedOptions, optionFilter, showSuggestedValues, suggestedValues]);

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOptionFilter(event.target.value);
    };

    const handleOnDelete = (value: string) => {
        const newValue = selectedValues.filter((v: string) => v !== value);
        props.updateStore(props.fieldKey, newValue);
    };

    const maxWidth = props.fieldOptions?.dialogMaxWidth || (optionCount < 25 ? 'sm' : optionCount < 100 ? 'md' : 'xl');
    const cellWidth = props.fieldOptions?.columns ? `${Math.floor(100 / Math.min(Math.max(props.fieldOptions.columns, 1), 20))}%` : optionCount < 15 ? '100%' : '33%';

    return (
        <Box
            sx={{
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field`}
        >
            <Box 
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    overflow: 'hidden',
                    backgroundColor: 'background.default',
                    px: 1,
                    py: 0.5,
                    borderRadius: 0.5,
                    outlineWidth: 2,
                    outlineColor: isFocused ? 'primary.main' : 'transparent',
                    outlineStyle: 'solid',
                }}
            >
                { props.label && (
                    <Box sx={{ maxWidth: '50%', pointerEvents: 'none', pr: 1 }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.label}>{props.label}</Typography>
                    </Box>
                )}
                <Box
                    tabIndex={0}
                    onClick={() => setIsDialogOpen(true)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        maxHeight: '898px',
                        //minHeight: '48px',
                        overflowY: 'auto',
}}>
                    {selectedValues.map((value: any) => {
                        const option = normalizedOptions.find(opt => opt.id === value);
                        return (
                            <Chip
                                key={value}
                                label={option ? option.label : value}
                                onDelete={() => handleOnDelete(value)}
                                sx={{ borderRadius: 0.5, bgcolor: 'secondary.main' }}
                            />
                        );
                    })}
                    {selectedValues.length === 0 && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 14 }}>
                            {props.fieldOptions?.placeholder || 'Open dialog...'}
                        </Typography>
                    )}
                </Box>
                <IconButton size="small" onClick={() => setIsDialogOpen(true)} className="nodrag" title="Open dialog">
                    <LaunchSharpIcon fontSize="small" />
                </IconButton>
            </Box>
            <Dialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                fullWidth
                maxWidth={maxWidth}
            >
                <DialogTitle
                    sx={{
                        bgcolor: 'secondary.dark',
                        px: 2, py: 1.5,
                        fontSize: 16,
                    }}
                >
                    {props.fieldOptions?.dialogTitle || props.label}
                </DialogTitle>
                <DialogContent sx={{ bgcolor: 'secondary.main', p: 0, position: 'relative' }}>
                    {optionCount > 50 && (
                        <Box sx={{ p: 1.5, bgcolor: 'secondary.main', position: 'sticky', top: 0, zIndex: 1 }}>
                            <OutlinedInput
                                fullWidth
                                size="small"
                                placeholder="Filter options..."
                                value={optionFilter}
                                onChange={handleFilterChange}
                            />
                            {suggestedValues.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                    <Checkbox
                                        size="small"
                                        checked={showSuggestedValues}
                                        onChange={(e) => { setOptionFilter(""); setShowSuggestedValues(e.target.checked); }}
                                        sx={{ p: 0.5, mr: 0.5 }}
                                        color="info"
                                    />
                                    <Typography variant="body2" sx={{ fontSize: 14, color: 'info.main', cursor: 'pointer' }} onClick={() => { setOptionFilter(""); setShowSuggestedValues(!showSuggestedValues); }}>
                                        Show suggested values
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                    <FormGroup
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 0,
                            flexDirection: 'row',
                            p: 1,
                        }}
                    >
                    {filteredOptions.map((option) => (
                        <FormControlLabel
                            key={option.id}
                            control={
                                <Checkbox size="small" checked={selectedValues.includes(option.id)} onChange={(_e, checked) => {
                                    const newValue = checked ? [...selectedValues, option.id] : selectedValues.filter((v: string) => v !== option.id);
                                    props.updateStore(props.fieldKey, newValue);
                                }} />
                            }
                            label={<Typography
                                sx={{
                                    fontSize: 14,
                                    color: selectedValues.includes(option.id) ? 'primary.main' : suggestedValues.includes(option.id) ? 'rgba(97, 233, 13, 1)' : 'text.primary',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }} variant="body2">{option.label}</Typography>}
                            sx={{ width: cellWidth, m: 0 }}
                        />
                    ))}
                    </FormGroup>
                </DialogContent>
                <DialogActions
                    sx={{
                        bgcolor: 'secondary.main',
                    }}
                >
                    <Typography variant="body2" sx={{ fontSize: 14, color: 'text.secondary' }}>
                        Selected options: {selectedValues.length} / {optionCount}
                    </Typography>
                    <Button onClick={() => {
                        props.updateStore(props.fieldKey, []);
                    }}>Clear Selection</Button>
                    <Button variant="contained" onClick={() => {
                        // Add your save logic here
                        setIsDialogOpen(false);
                    }}>Done</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}