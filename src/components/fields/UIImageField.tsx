import { FieldProps } from "../NodeContent";
import config from '../../../config';
import Box from "@mui/material/Box";
import { KeyboardEventHandler, MouseEventHandler, useCallback, useEffect, memo, useRef, useState, WheelEventHandler } from "react";
import Modal from "@mui/material/Modal";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { deepEqual } from '../utils/deepEqual';

const LightBox = memo(({ urls, index, label, onClose }: { urls: {url: string, width: number, height: number}[], index: number, label: string, onClose: () => void }) => {
    const theme = useTheme();

    const [currentIndex, setCurrentIndex] = useState(-1);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const timeRef = useRef(0);

    // Add mouse drag handlers for panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom === 1) return;
        isDraggingRef.current = true;
        dragStartRef.current = {
            x: e.clientX - pan.x,
            y: e.clientY - pan.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current) return;
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        
        // Calculate bounds to prevent panning outside image bounds
        const bounds = {
            x: Math.min(Math.max(newX, -(zoom - 1) * 500), (zoom - 1) * 500),
            y: Math.min(Math.max(newY, -(zoom - 1) * 500), (zoom - 1) * 500)
        };
        
        setPan(bounds);
    };

    const handleMouseUp = (_: React.MouseEvent) => {
        isDraggingRef.current = false;
    };

    // Reset pan when zoom changes or image changes
    useEffect(() => {
        setPan({ x: 0, y: 0 });
    }, [zoom, currentIndex]);

    useEffect(() => {
        timeRef.current = Date.now();
    }, [urls]);

    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setCurrentIndex(index);
    }, [index]);

    const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>((e) => {
        if (currentIndex === -1) return;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
            }
            if (e.key === 'ArrowRight' && currentIndex < urls.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }    
        }
    }, [currentIndex, urls.length]);

    const handleWheel = useCallback<WheelEventHandler<HTMLDivElement>>((e) => {
        if (currentIndex === -1) return;
        setZoom(prev => Math.min(Math.max(1, prev - e.deltaY * 0.005), 4));
    }, [currentIndex]);

    const currentUrl = () => {
        if (currentIndex === -1) return '';
        return `http://${config.serverAddress}${urls[currentIndex].url.split('?')[0].replace(/\/$/, '')}?t=${timeRef.current}`;
    };

    // Navigation handlers
    const handlePrevImage = useCallback<MouseEventHandler<HTMLButtonElement>>(() => currentIndex > 0 && setCurrentIndex(currentIndex - 1), [currentIndex]);
    const handleNextImage = useCallback<MouseEventHandler<HTMLButtonElement>>(() => currentIndex < urls.length - 1 && setCurrentIndex(currentIndex + 1), [currentIndex, urls.length]);

    return (
        <Modal
            open={currentIndex > -1}
            onClose={onClose}
            onKeyDown={handleKeyDown}
            onWheel={handleWheel}
            aria-labelledby="lightbox"
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onClick={onClose}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 1,
                        mb: 1, mt: 2,
                        //border: `1px solid ${theme.palette.divider}`,
                    }}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                >
                    <IconButton 
                        onClick={handlePrevImage}
                        disabled={currentIndex === 0}
                        size="small"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <IconButton
                        onClick={handleNextImage}
                        disabled={currentIndex === urls.length - 1}
                        size="small"
                    >
                        <ArrowForwardIcon />
                    </IconButton>
                    <Slider
                        value={zoom}
                        onChange={(_, newValue) => setZoom(newValue as number)}
                        min={1}
                        max={4}
                        step={0.1}
                        sx={{ mx: 2, width: 200 }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: zoom > 1 ? 'grab' : 'default',
                        '&:active': {
                            cursor: zoom > 1 ? 'grabbing' : 'default',
                        },
                        '& img': {
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            p: 0, m: 0,
                            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                            transition: isDraggingRef.current ? 'none' : 'transform 0.2s',
                            pointerEvents: 'none',
                            imageRendering: 'pixelated'
                        }
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                >
                {currentIndex > -1 && (
                    <img
                        src={currentUrl()}
                        alt={`${label} ${currentIndex}`}
                        width={`${urls[currentIndex].width}`}
                        height={`${urls[currentIndex].height}`}
                    />
                )}
                </Box>
            </Box>
        </Modal>
    )
}, (prevProps, nextProps) => {
    if (prevProps.index !== nextProps.index) { 
        return false;
    }

    if (!deepEqual(prevProps.urls, nextProps.urls)) {
        return false;
    }

    return true;
});

const UIImageField = ({ fieldKey, value, style, disabled, hidden, label }: FieldProps) => {
    if (typeof value === 'string') {
        value = [{url: value, width: 0, height: 0}];
    }

    //const imgWidth = value.length > 1 ? '50%' : '100%';
    const containerWidth = value.length > 1 ? '1288px' : 'auto';
    const maxHeight = value.length > 4 ? '1360px' : 'auto';

    const imageWidth = (width: number, height: number) => {
        if (value.length === 1) {
            return '100%';
        }
        const aspectRatio = width / height;
        if (aspectRatio > 1.6) {
            return '100%';
        }
        return '50%';
    }

    const [modalIndex, setModalIndex] = useState(-1);

    const handleModalOpen = (index: number) => {
        setModalIndex(index);
    };

    return (
        <>
        <Box
            data-key={fieldKey}
            sx={{
                width: containerWidth,
                height: 'auto',
                maxWidth: '2048px',
                maxHeight: maxHeight,
                overflow: value.length > 4 ? 'auto' : 'hidden',
                mb: 2,
                ...style,
            }}
            className={`${value.length > 4 ? 'nowheel' : ''} ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
        >
            {value.map(({url, width, height}: {url: string, width: number, height: number}, index: number) => (
                <Box
                    key={`${fieldKey}-${index}`}
                    sx={{
                        width: imageWidth(Number(width), Number(height)),
                        height: 'auto',
                        display: 'block',
                        float: 'left',
                        '& img': {
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            p: 0.25,
                            cursor: 'pointer'
                        }
                    }}
                >
                    <img src={`http://${config.serverAddress}${url}`} alt={`${label} ${index}`} onClick={() => handleModalOpen(index)} />
                </Box>
            ))}
        </Box>

        <LightBox
            urls={value}
            index={modalIndex}
            label={label || ''}
            onClose={() => setModalIndex(-1)}
        />
        </>
    );
};

export default UIImageField;