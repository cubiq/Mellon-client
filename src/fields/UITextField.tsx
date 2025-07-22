import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";

export default function UITextField(props: FieldProps) {
    return (
        <Box
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} nowheel`}
            sx={{
                width: '100%',
                overflow: 'auto',
                maxHeight: '75vh',
                ...props.style,
                '& pre': {
                    fontSize: 12,
                    color: 'text.secondary',
                    border: '1px solid',
                    borderColor: 'secondary.main',
                    backgroundColor: 'secondary.dark',
                    p: 1,
                    borderRadius: 0.5,
                },
            }}
        >
            <pre><code>{props.value || ' '}</code></pre>
        </Box>
    );
}