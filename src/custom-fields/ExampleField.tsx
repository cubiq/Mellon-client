import Box from "@mui/material/Box";
import { FieldProps } from "../components/NodeContent";
import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";

export default function ExampleField(props: FieldProps) {
    const [red, setRed] = useState(0);
    const [green, setGreen] = useState(0);
    const [blue, setBlue] = useState(0);

    const handleChange = (color: string, value: number) => {
        if (color === 'red') {
            setRed(value);
            props.updateStore(props.fieldKey, `${value},${green},${blue}`);
        } else if (color === 'green') {
            setGreen(value);
            props.updateStore(props.fieldKey, `${red},${value},${blue}`);
        } else if (color === 'blue') {
            setBlue(value);
            props.updateStore(props.fieldKey, `${red},${green},${value}`);
        }
    }

    useEffect(() => {
        const rgb = props.value ? props.value.split(',') : ['0', '0', '0'];

        setRed(parseInt(rgb[0]));
        setGreen(parseInt(rgb[1]));
        setBlue(parseInt(rgb[2]));
    }, []);
    
    return (
        <Box
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} nodrag`}
            sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                '&:hover': {
                    cursor: 'pointer'
                },
                ...props.style,
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Typography variant="h6" sx={{ textAlign: 'center' }}>{props.label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ width: '60px', textAlign: 'right' }}>Red:</Box><input type="range" min={0} max={255} value={red} onChange={(e) => handleChange('red', parseInt(e.target.value))} style={{ accentColor: `rgb(${red},0,0)` }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ width: '60px', textAlign: 'right' }}>Green:</Box><input type="range" min={0} max={255} value={green} onChange={(e) => handleChange('green', parseInt(e.target.value))} style={{ accentColor: `rgb(0,${green},0)` }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ width: '60px', textAlign: 'right' }}>Blue:</Box><input type="range" min={0} max={255} value={blue} onChange={(e) => handleChange('blue', parseInt(e.target.value))} style={{ accentColor: `rgb(0,0,${blue})` }} />
            </Box>
            <Box
                title={`RGB Value: ${red}, ${green}, ${blue}`}
                sx={{
                    width: '100%',
                    height: '64px',
                    backgroundColor: `rgb(${red},${green},${blue})`,
                    borderRadius: 0.5,
                    border: '2px solid #000',
                    marginTop: 1,
                }}
            />
        </Box>
    )
}
