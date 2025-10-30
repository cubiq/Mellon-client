import { FieldProps } from "../components/NodeContent";

import Box from "@mui/material/Box";
import config from "../../app.config";

export default function UIVideoField(props: FieldProps) {
  const video = ((video: any) => {
    if (!video) return null;

    if (typeof(video) === 'string' && video.slice(0, 5) !== 'data:') {
      return `data:${props.fieldOptions?.mimeType || 'video/mp4'};base64,${video}`;
    }
    return `${config.serverAddress}${video}`;
  })(props.value);

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
      {video && (
        <Box
          sx={{
            height: 'auto',
            maxWidth: '100%',
            position: 'relative',
            '& video': {
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              p: 0.25,
            }
          }}
        >
            <video
                src={video}
                controls
                onError={e => { (e.currentTarget as HTMLVideoElement).poster = "data:image/svg+xml;utf8,<svg width='512' height='512' xmlns='http://www.w3.org/2000/svg'><defs><pattern id='checker' width='32' height='32' patternUnits='userSpaceOnUse'><rect width='32' height='32' fill='%23ffffff11'/><rect x='0' y='0' width='16' height='16' fill='%23ffffff33'/><rect x='16' y='16' width='16' height='16' fill='%23ffffff33'/></pattern></defs><rect width='512' height='512' fill='url(%23checker)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%23FAFAFA' font-family='JetBrains Mono, monospace'>Video not ready</text></svg>"; }}
                onLoadedData={e => { (e.currentTarget as HTMLVideoElement).poster = ''; }}
            />
        </Box>
      )}
    </Box>
  );
}