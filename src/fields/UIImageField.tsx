import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import config from "../../app.config";
import IconButton from "@mui/material/IconButton";
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';

export default function UIImageField(props: FieldProps) {
  let images = !Array.isArray(props.value) ? [props.value] : props.value;
  images = images.filter((image) => image !== '' && image !== null && image !== undefined);

  images = images.map((image) => {
    if (props.dataType === 'url') {
      return `${config.serverAddress}${image}`;
    }

    if (image.slice(0, 5) !== 'data:') {
      image = `data:${props.fieldOptions?.mimeType || 'image/webp'};base64,${image}`;
    }

    return image;
  });

  const handleOnError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/assets/mellon.svg';
  };

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
      {images.length > 0 && images.map((image, index) => (
        <Box
          key={index}
          sx={{
            height: 'auto',
            maxWidth: `${images.length === 1 ? '100%' : '50%'}`,
            position: 'relative',
            '& img': {
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              p: 0.25,
            }
          }}
        >
          <img src={image} alt={`${props.label} ${index}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="crisp-image" onError={handleOnError} />
          <IconButton
            size='medium'
            className="nodrag"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1000,
              bgcolor: 'rgba(0, 0, 0, 0.45)',
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.75)',
                color: 'primary.light',
              },
            }}
          >
            <ZoomOutMapIcon />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
}