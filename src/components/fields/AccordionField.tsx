import { styled } from "@mui/material/styles"
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import NodeContent from "../NodeContent";

import { GroupProps } from "../NodeContent";

const PlainAccordion = styled(Accordion)(({ theme }) => ({
    boxShadow: 'none',
    border: 0,
    padding: 0,
    margin: 0,
    background: 'transparent',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:before': { background: 'transparent' },
    '.MuiAccordionSummary-root': { padding: '0 4px', margin: 0, background: 'transparent', color: theme.palette.text.secondary, minHeight: '0', border: 'none' },
    '.MuiAccordionDetails-root': { padding: 0, margin: 0, border: 'none' },
    '.MuiAccordionSummary-root:hover, .MuiAccordionSummary-root:hover .MuiAccordionSummary-expandIconWrapper': { color: theme.palette.primary.main },
}));

const AccordionField = (
    { fieldKey, label, open, disabled, hidden, style, fields, updateStore }: GroupProps
) => {
    return (
        <PlainAccordion
            data-key={fieldKey}
            disableGutters={true}
            square={true}
            className={`nodrag ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
            expanded={open}
            onChange={(_, expanded) => {
                updateStore(fieldKey, { open: expanded }, 'group');
            }}
            sx={{ ...style }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {label || fieldKey}
            </AccordionSummary>
            <AccordionDetails>
                <NodeContent
                    fields={fields}
                    updateStore={updateStore}
                    parentDisabled={disabled}
                />
            </AccordionDetails>
        </PlainAccordion>
    )
}

export default AccordionField;