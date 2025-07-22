import Box from "@mui/material/Box";
import { FieldProps } from "../components/NodeContent";
import Button from "@mui/material/Button";
import CircularProgress from '@mui/material/CircularProgress';
import fieldAction from "../utils/fieldAction";

export default function UIButtonField(props: FieldProps) {
    const handleClick = async () => {
        const action = typeof props.onChange === 'string' ? 'exec' : props.onChange?.action;
        const data = typeof props.onChange === 'string' ? props.onChange : props.onChange?.data;
        // ButtonField supports only exec action for now
        if (action !== 'exec') {
            return;
        }
        fieldAction(props, data);
    }
    return (
        <Box
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} nodrag`}
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