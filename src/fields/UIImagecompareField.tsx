import { FieldProps } from "../components/NodeContent";
//import { useSettingsStore } from "../stores/useSettingsStore";
import { useCallback, useRef, useState, useEffect } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import config from "../../app.config";
// import IconButton from "@mui/material/IconButton";
// import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
// import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
// import ArrowRightIcon from '@mui/icons-material/ArrowRight';

export default function UIImagecompareField(props: FieldProps) {
  //const { setLightboxOpener } = useSettingsStore();
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // const handleImageClick = (index: number) => {
  //   if (props.value && Array.isArray(props.value) && props.value.length > 0) {
  //     setLightboxOpener({ images: props.value, currentIndex: index, dataType: props.dataType, mimeType: props.fieldOptions?.mimeType || 'image/webp' });
  //   }
  // };

  let images = !Array.isArray(props.value) ? [props.value] : props.value;
  images = images.filter((image) => image !== '' && image !== null && image !== undefined);
  let imageFrom = Array.isArray(images[0]) ? images[0][0] : images[0];
  let imageTo = Array.isArray(images[1]) ? images[1][0] : images[1];

  function img2src(image: string) {
    if (props.dataType === 'url') {
      return `${config.serverAddress}${image}`;
    }

    if (image.slice(0, 5) !== 'data:') {
      image = `data:${props.fieldOptions?.mimeType || 'image/webp'};base64,${image}`;
    }

    return image;
  }

  const svgBlob = new Blob([`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <rect width="512" height="512" fill="black" />
    </svg>
  `], { type: 'image/svg+xml' });
  imageFrom = imageFrom ? img2src(imageFrom) : URL.createObjectURL(svgBlob);
  imageTo = imageTo ? img2src(imageTo) : URL.createObjectURL(svgBlob);

  const handleOnError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/assets/mellon.svg';
  };

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    handleMove(clientX);
  };
  const endDrag = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => {
      window.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, []);

  return (
    <Box
      data-key={props.fieldKey}
      className={`${props.hidden ? 'mellon-hidden' : ''} nodrag`}
      sx={{
        width: '100%',
        px: 4, py: 1,
        ...props.style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          cursor: 'ew-resize',
        }}
        onMouseMove={handleMouseMove}
        //onMouseLeave={endDrag}
        onMouseUp={endDrag}
        onMouseDown={handleMouseDown}
      >
        {/* Bottom image (imageFrom) */}
        <Box sx={{ width: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 0 }}>
          <img
            src={imageTo}
            alt="Original"
            onError={handleOnError}
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', pointerEvents: 'none' }}
            //className="crisp-image"
          />
        </Box>

        {/* Top image (imageTo) */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            clipPath: `inset(0 ${Math.max(0, 100 - sliderPosition)}% 0 0)`, // TODO: check browser compatibility
            backgroundColor: 'background.default',
          }}
        >
          <img
            src={imageFrom}
            alt="Modified"
            onError={handleOnError}
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', pointerEvents: 'none' }}
            //className="crisp-image"
          />
        </Box>

        {/* Slider Handle */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: `calc(${sliderPosition}% - 2px)`,
            width: '4px',
            height: '100%',
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            cursor: 'ew-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            outline: '1px solid rgba(0,0,0,0.7)',
          }}
        >
        </Box>
      </Box>
      <Button
        variant="contained"
        color="secondary"
        size="small"
        onClick={() => {
          setSliderPosition(
            sliderPosition < 50 && sliderPosition > 0 ? 0 : sliderPosition < 100 ? 100 : 0
          );
        }}
        sx={{
          whiteSpace: 'nowrap',
        }}
      >
        Toggle images
      </Button>
    </Box>
  );
}