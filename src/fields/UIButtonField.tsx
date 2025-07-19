import Box from "@mui/material/Box";
import { FieldProps } from "../components/NodeContent";
import Button from "@mui/material/Button";
import runFieldAction from "../utils/runFieldAction";
import CircularProgress from '@mui/material/CircularProgress';

export default function UIButtonField(props: FieldProps) {
    const handleClick = async () => {
        if (typeof props.onChange !== 'string') {
            return;
        }

        props.updateStore(props.fieldKey, true, 'disabled');
        try {
            await runFieldAction(props.nodeId, props.module, props.action, props.onChange, props.fieldKey, props.fieldOptions?.queue || false);
        } catch (error) {
            props.updateStore(props.fieldKey, false, 'disabled');
        } finally {
            if (!props.fieldOptions?.queue) {
                props.updateStore(props.fieldKey, false, 'disabled');
            }
        }
    }
    return (
        <Box
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field nodrag`}
            sx={{
                width: '100%',
                ...props.style,
            }}
        >
            <Button variant={props.fieldOptions?.variant || 'outlined'} color={props.fieldOptions?.color || 'primary'} onClick={handleClick} disabled={props.disabled} sx={{ width: '100%' }}>
                {props.disabled ? <CircularProgress size={25} /> : props.label || ' '}
            </Button>
        </Box>
    );  
}