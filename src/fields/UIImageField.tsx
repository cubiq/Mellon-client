import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import config from "../../app.config";

export default function UIImageField(props: FieldProps) {
  let images = !Array.isArray(props.value) ? [props.value] : props.value;
  images = images.filter((image) => image !== '');

  return (
    <Box
      data-key={props.fieldKey}
      className={`${props.hidden ? 'mellon-hidden' : ''}`}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        width: '100%',
        ...props.style,
      }}
    >
      {images.map((image, index) => (
        <Box
          key={index}
          sx={{
            height: 'auto',
            maxWidth: `${images.length === 1 ? '100%' : '50%'}`,
            '& img': {
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              p: 0.25
            }
          }}
        >
          <img src={`${config.serverAddress}${image}`} alt={`${props.label} ${index}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>
      ))}
    </Box>
  );
}