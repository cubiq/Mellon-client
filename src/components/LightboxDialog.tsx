import { useState } from "react";

import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import config from "../../app.config";

function LightboxDialog({ opener, onClose }: { opener: { images: string[], currentIndex: number, dataType: string | null, mimeType: string | null } | null; onClose: () => void }) {
    let images = opener && !Array.isArray(opener?.images) ? [opener?.images] : opener?.images || [];
    images = images.filter((image) => image !== '' && image !== null && image !== undefined);

    const initialIndex = opener ? opener.currentIndex : Math.min(0, images.length - 1);
    const [lbIndex, setLbIndex] = useState<number>(initialIndex);

    images = images.map((image) => {
        if (opener?.dataType === 'url') {
            return `${config.serverAddress}${image}`;
        }

        if (image.slice(0, 5) !== 'data:') {
            image = `data:${opener?.mimeType || 'image/webp'};base64,${image}`;
        }

        return image;
    });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            setLbIndex(prev => (prev - 1 + images.length) % images.length);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            setLbIndex(prev => (prev + 1) % images.length);
        }
    };

    const handleOnError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = '/assets/mellon.svg';
    };

    return (
        <Modal
            open={!!opener}
            onClose={onClose}
            onKeyDown={handleKeyDown}
        >
            <Box
                onClick={onClose}
                sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexDirection: 'column',
                    gap: 0,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                        position: 'relative',
                        py: 4,
                        width: '100%',
                        '& img': {
                            display: 'block',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            objectFit: 'contain',
                            border: '16px solid rgba(0, 0, 0, 0.75)',
                        },
                    }}
                >
                    <img src={images[lbIndex]} alt={`Image ${lbIndex + 1}`} className="crisp-image" onClick={(e) => e.stopPropagation()} onError={handleOnError} />
                    <IconButton
                        className="nodrag"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: 'text.primary',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 9999,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.75)',
                                color: 'primary.light',
                            },
                        }}
                    >
                        <CloseIcon sx={{ width: 42, height: 42 }} />
                    </IconButton>
                </Box>
                {images.length > 1 && (
                    <Box
                        onClick={(e) => { e.stopPropagation(); }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: 128,
                            flexShrink: 0,
                            flexGrow: 0,
                            p: 1.5,
                            bgcolor: 'rgba(0, 0, 0, 0.75)',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            flexDirection: 'row',
                            gap: 0,
                            '& img': {
                                display: 'block',
                                height: '100%',
                                width: 'auto',
                                objectFit: 'contain',
                                cursor: 'pointer',
                                mx: 0.5,
                                border: '2px solid transparent',
                                borderRadius: 0.5,
                                '&.active': {
                                    borderColor: '#000',
                                    outline: '2px solid',
                                    outlineColor: 'primary.main',
                                },
                            },
                        }}
                    >
                        {images.map((image, index) => (
                            <img key={index} src={image} alt={`Image ${index + 1}`} className={`crisp-image ${lbIndex === index ? 'active' : ''}`} onClick={() => setLbIndex(index)} onError={handleOnError} />
                        ))}
                    </Box>
                )}
            </Box>
        </Modal>
    );
}

export default LightboxDialog;
