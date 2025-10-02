import { useState, useRef } from "react";
import { useUpdateNodeInternals } from '@xyflow/react'

import { FieldProps } from "../components/NodeContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import CloseIcon from '@mui/icons-material/Close';
import config from "../../app.config";
import { useSettingsStore } from "../stores/useSettingsStore";
import InputField from "./InputField";
import IconButton from "@mui/material/IconButton";

export default function FileBrowserField(props: FieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setFileBrowserOpener = useSettingsStore(state => state.setFileBrowserOpener);
  const [isDropActive, setIsDropActive] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const currentPath = props.value?.length > 0 
    ? props.value[0].split(/[/\\]/).slice(0, -1).join('/') 
    : '.';

  // if none of the values is empty, add an empty string to allow adding more files
  const fieldValue = (props.fieldOptions?.multiple && props.value && !props.value.includes('') ? [...props.value, ''] : props.value) || [''];
  const displayValue = fieldValue.filter((file: string) => file.match(/\.(jpe?g|a?png|webp|gif|bmp|ico|tiff|svg)$/i)) || [];
  const isTextFieldEditable = props.fieldOptions?.editable !== false;

  async function uploadImageFile(file: File) {
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
        //props.updateStore(props.fieldKey, Array.isArray(data.path) ? data.path : [data.path]);
        const newFiles = Array.isArray(data.path) ? data.path : [data.path];
        const updatedFiles = props.fieldOptions?.multiple ? 
          Array.from(new Set([...(props.value || []), ...newFiles])) : 
          newFiles;
        props.updateStore(props.fieldKey, updatedFiles);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDropActive(false);
    const files = [...e.dataTransfer.files].filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      await uploadImageFile(files[0]);
    }
  }

  async function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      await uploadImageFile(files[0]);
    }
  }

  const handleImageLoad = () => {
    // Update node internals after the image has loaded and the node has re-rendered
    setTimeout(() => {
      updateNodeInternals(props.nodeId);
    }, 100);
  };

  const updateArrayValues = (value: string, key?: number) => {
    const newValues = props.value ? [...props.value] : [];
    if (key !== undefined) {
      newValues[key] = value;
    } else {
      newValues.push(value);
    }
    props.updateStore(props.fieldKey, Array.from(new Set(newValues)));
  };

  const getGridColumns = (count: number) => {
    if (count <= 1) return 1;
    const maxCols = 4;
    const cols = Math.ceil(Math.sqrt(count));
    return Math.min(cols, maxCols);
  };

  const removeImage = (fileToRemove: string) => {
    const newValues = props.value?.filter((file: string) => file !== fileToRemove) || [];
    props.updateStore(props.fieldKey, newValues);
    queueMicrotask(() => {
      updateNodeInternals(props.nodeId);
    });
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
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0.5 }}>
          { isTextFieldEditable ? (
            fieldValue.map((file: string, index: number) => (
              <InputField
                key={index}
                {...props}
                value={file}
                updateStore={(_, file) => updateArrayValues(file, index)}
              />
            ))
          ) : (
            fieldValue.map((file: string, index: number) => (
              <Typography key={index} variant="body2" sx={{ flexGrow: 1, wordBreak: 'break-all', color: 'text.secondary', bgcolor: 'background.default', px: 1, py: 0.5, borderRadius: 0.5 }}>
                {file}
              </Typography>
            ))
          )}
        </Box>
        <IconButton
          size="small"
          sx={{ ml: 0.5, flexGrow: 0 }}
          title="Open file browser"
          onClick={() => setFileBrowserOpener({
            nodeId: props.nodeId,
            fieldKey: props.fieldKey,
            fileTypes: props.fieldOptions?.fileTypes,
            path: currentPath,
            multiple: props.fieldOptions?.multiple ?? false,
            initialValues: props.value,
          })}
        >
          <FolderOpenOutlinedIcon />
        </IconButton>
      </Box>

      {/* Hidden file input for OS file dialog */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/** File drop area */}
      <Box
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDropActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDropActive(false); }}
        onDrop={handleFileDrop}
        sx={{
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          border: '1px dashed',
          borderRadius: 0,
          p: 1,
          mt: 1,
          textAlign: 'center',
          overflow: 'hidden',
          borderColor: isDropActive ? 'text.secondary' : 'divider',
          backgroundColor: isDropActive ? 'success.dark' : 'transparent',
          display: 'grid',
          gridTemplateColumns: `repeat(${getGridColumns(displayValue.length)}, 1fr)`,
          gap: 1,
          '&>div>img': {
            display: 'block',
            margin: '0 auto',
            maxWidth: '360px',
            maxHeight: '1024px',
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
          },
        }}
      >
        {displayValue && displayValue.length > 0 ? (
          displayValue.map((file: string, index: number) => (
            <Box key={index} sx={{ position: 'relative' }}>
              <img
                src={`${config.serverAddress}/preview?file=${encodeURIComponent(file)}`}
                alt={file}
                onLoad={handleImageLoad}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src =
                    "data:image/svg+xml;utf8,<svg width='512' height='512' xmlns='http://www.w3.org/2000/svg'><defs><pattern id='checker' width='32' height='32' patternUnits='userSpaceOnUse'><rect width='32' height='32' fill='%23ffffff11'/><rect x='0' y='0' width='16' height='16' fill='%23ffffff33'/><rect x='16' y='16' width='16' height='16' fill='%23ffffff33'/></pattern></defs><rect width='512' height='512' fill='url(%23checker)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%23FAFAFA' font-family='JetBrains Mono, monospace'>Image not found</text></svg>";
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); removeImage(file); }}
                title="Remove image"
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'error.main',
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
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
