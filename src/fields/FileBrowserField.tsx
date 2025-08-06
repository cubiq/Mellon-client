import { useState } from "react";
import { useUpdateNodeInternals } from '@xyflow/react'

import { FieldProps } from "../components/NodeContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import Button from "@mui/material/Button";
import config from "../../app.config";
import { useSettingsStore } from "../stores/useSettingsStore";

export default function FileBrowserField(props: FieldProps) {
    const setFileBrowserOpener = useSettingsStore(state => state.setFileBrowserOpener);
    const [isDropActive, setIsDropActive] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const currentPath = props.value?.length > 0 
        ? props.value[0].split(/[/\\]/).slice(0, -1).join('/') 
        : '.';

    async function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setIsDropActive(false);
        const files = [...e.dataTransfer.files].filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            const file = files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'images'); // TODO: add more types support
            try {
                const response = await fetch(`${config.serverAddress}/file`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();

                if (!data.error) {
                    props.updateStore(props.fieldKey, Array.isArray(data.path) ? data.path : [data.path]);
                } else {
                    console.error(data.error);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    const handleImageLoad = () => {
        // Update node internals after the image has loaded and the node has been re-rendered
        setTimeout(() => {
            updateNodeInternals(props.nodeId);
        }, 0);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field`}
        >
            <Button
                variant="contained"
                color="secondary"
                onClick={() => setFileBrowserOpener({ nodeId: props.nodeId, fieldKey: props.fieldKey, fileTypes: props.fieldOptions?.fileTypes, path: currentPath })}
                startIcon={<FolderOpenOutlinedIcon />}
                className="nodrag"
                sx={{
                    whiteSpace: 'nowrap',
                }}
            >
                Select File
            </Button>

            {/** File drop area */}
            <Box
                onDragOver={(e) => { e.preventDefault(); setIsDropActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDropActive(false); }}
                onDrop={handleFileDrop}
                sx={{
                    width: '100%',
                    height: '100%',
                    border: '1px dashed',
                    borderRadius: 0,
                    p: 1,
                    mt: 1,
                    textAlign: 'center',
                    overflow: 'hidden',
                    borderColor: isDropActive ? 'secondary.light' : 'divider',
                    backgroundColor: isDropActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    '&>img': {
                        display: 'block',
                        margin: '0 auto',
                        maxWidth: '1024px',
                        maxHeight: '1024px',
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                    },
                }}
            >
                {props.value && props.value.length > 0 ? (
                    props.value.map((file: string, index: number) => (
                        <img 
                            key={index} 
                            src={`${config.serverAddress}/preview?file=${encodeURIComponent(file)}`} 
                            alt={file} 
                            onLoad={handleImageLoad}
                        />
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Drop files here to upload
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
