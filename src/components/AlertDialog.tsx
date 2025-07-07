import { useEffect, useState } from "react";

import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

import WarningIcon from '@mui/icons-material/Warning';
import Box from "@mui/material/Box";

function AlertDialog({
    opener,
    onClose,
}: {
    opener: {
        title: string | null,
        message: string,
        confirmText: string | null,
        cancelText: string | null,
        onConfirm: () => void,
        onCancel?: () => void | null,
    } | null,
    onClose: () => void,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState<typeof opener>(null);

    function handleCancel() {
        if (content?.onCancel) {
            content.onCancel();
        }
        onClose();
    }

    function handleConfirm() {
        if (content?.onConfirm) {
            content.onConfirm();
        }
        onClose();
    }

    useEffect(() => {
        if (opener !== null) {
            setContent(opener);
        }

        setIsOpen(!!opener);
    }, [opener]);

    return (
        <>
            <Dialog
                open={isOpen}
                onClose={onClose}
                maxWidth="sm"
                slotProps={{
                    paper: {
                        sx: {
                            backgroundColor: 'secondary.dark',
                            backgroundImage: 'none',
                            borderRadius: 0,
                        },
                    },
                }}
            >
                {content?.title && (
                    <DialogTitle sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: 1, p: 2, fontSize: '18px' }}>
                        <WarningIcon sx={{ color: 'warning.main', width: 28, height: 28 }} />
                        <Box>{content.title}</Box>
                    </DialogTitle>
                )}
                <DialogContent>
                    <Typography sx={{ pt: 2 }}>{content?.message}</Typography>
                </DialogContent>

                <DialogActions sx={{ pb: 2, pr: 2 }}>
                    <Button variant="outlined" onClick={handleCancel}>{content?.cancelText || 'Cancel'}</Button>
                    <Button variant="contained" onClick={handleConfirm}>{content?.confirmText || 'Confirm'}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default AlertDialog;