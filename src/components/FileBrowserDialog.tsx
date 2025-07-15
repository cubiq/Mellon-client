import { useCallback, useEffect, useState, memo } from 'react';

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FolderIcon from "@mui/icons-material/Folder";
import HomeIcon from '@mui/icons-material/Home';
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import CircularProgress from '@mui/material/CircularProgress';
import OutlinedInput from '@mui/material/OutlinedInput';

import config from '../../app.config';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';

export interface FileItem {
    is_dir: boolean;
    is_hidden: boolean;
    name: string;
    path: string;
    modified: number;
    size: number | null;
    ext: string | null;
    type: string | null;
}

interface DirectoryListing {
    files: FileItem[];
    path: string;
    abs_path: string;
}

function formatDate(date: number): string {
    return new Intl.DateTimeFormat(undefined, {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date(date * 1000));
}

const DirectoryRow = memo(({ file, onPathChange }: { file: FileItem, onPathChange: (path: string) => void }) => (
    <TableRow
        hover
        onClick={() => onPathChange(file.path)}
        sx={{ cursor: 'pointer' }}
    >
        <TableCell padding='checkbox'>
            <FolderIcon sx={{ color: 'primary.dark' }} />
        </TableCell>
        <TableCell>{file.name}</TableCell>
        <TableCell sx={{ textAlign: 'right' }}>{formatDate(file.modified)}</TableCell>
    </TableRow>
));

const FileRow = memo(({ 
    file, 
    isSelected, 
    onFileClick 
}: { 
    file: FileItem, 
    isSelected: boolean, 
    onFileClick: (file: FileItem) => void 
}) => (
    <TableRow
        hover
        onClick={() => onFileClick(file)}
        sx={{ cursor: 'pointer', backgroundColor: isSelected ? 'secondary.main' : 'transparent' }}
    >
        <TableCell padding='checkbox'>
            <Checkbox
                checked={isSelected}
                tabIndex={-1}
                disableRipple
            />
        </TableCell>
        <TableCell sx={{ width: 'auto' }}>{file.name}</TableCell>
        <TableCell sx={{ textAlign: 'right' }}>{formatDate(file.modified)}</TableCell>
    </TableRow>
));

function FileBrowserDialog({
    opener,
    onClose,
    onSelect,
    multiple = false
}: {
    opener: { nodeId: string, fieldKey: string, fileTypes: string[], path: string, updateStore?: (fieldKey: string, value: any) => void } | null,
    onClose: () => void,
    onSelect?: (files: string[]) => void,
    multiple?: boolean
}) {
    const [currentPath, setCurrentPath] = useState<string>('.');
    const [directoryListing, setDirectoryListing] = useState<DirectoryListing | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');
    //const [showHiddenFiles, setShowHiddenFiles] = useState<boolean>(false);

    const fetchDirectoryListing = useCallback(async (path: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${config.serverAddress}/listdir?path=${encodeURIComponent(path)}&type=${opener?.fileTypes.join(',') ?? ''}`);
            const data = await response.json();
            /* filter out hidden files if showHiddenFiles is false
            if (!showHiddenFiles) {
                data.files = data.files.filter((file: FileItem) => !file.is_hidden);
            }*/
            if (data.error) {
                console.error('Error fetching directory listing:', data.error);
                data.files = [];
                data.path = data.path || '.';
                data.abs_path = data.abs_path || '.';
            }
            if (search) {
                data.files = data.files.filter((file: FileItem) => file.name.toLowerCase().includes(search.toLowerCase()));
            }
            setDirectoryListing(data);
        } catch (error) {
            console.error('Error fetching directory listing:', error);
        } finally {
            setIsLoading(false);
        }
    }, [config.serverAddress, search, opener]);

    const handleFileClick = useCallback((file: FileItem) => {
        setSelectedFiles(prev => {
            if (prev.some(f => f.path === file.path)) {
                return prev.filter(f => f.path !== file.path);
            }
            return multiple ? [...prev, file] : [file];
        });
    }, [multiple]);

    useEffect(() => {
        setCurrentPath(opener?.path || '.');
    }, [opener]);

    useEffect(() => {
        fetchDirectoryListing(currentPath);
    }, [currentPath, fetchDirectoryListing]);

    function formatFileSize(size: number): string {
        if (size === 0) {
            return '0 B';
        }
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(size) / Math.log(1024));
        return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
    }

    return (
        <Dialog
            open={!!opener}
            onClose={() => { onClose(); setCurrentPath('.'); setSearch(''); }}
            fullWidth
            maxWidth="lg"
            slotProps={{
                paper: {
                    sx: {
                        height: '100%',
                        maxHeight: '75vh',
                        overflow: 'hidden',
                        backgroundColor: 'secondary.dark',
                        backgroundImage: 'none',
                        borderRadius: 0,
                    },
                },
            }}
        >
            <DialogTitle>
                <Breadcrumbs>
                    <Link component="button" onClick={() => { setCurrentPath('.'); setSelectedFiles([]); }}>
                        <HomeIcon />
                    </Link>
                    {currentPath.split('/').map((segment, index) => {
                        const path = currentPath.split('/').slice(0, index + 1).join('/');
                        const isLast = index === currentPath.split('/').length - 1;
                        return isLast ? (
                            <Typography key={index}>
                                {segment}
                            </Typography>
                        ) : (
                            <Link key={index} component="button" onClick={() => { setCurrentPath(path); setSelectedFiles([]); }}>
                                {segment}
                            </Link>
                        );
                    })}
                </Breadcrumbs>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                <TableContainer sx={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}>
                    {isLoading && (
                        <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: 'secondary.dark',
                            zIndex: 2
                        }}>
                            <CircularProgress />
                        </Box>
                    )}
                    <Table stickyHeader size="small" sx={{
                        tableLayout: 'fixed',
                        '& .MuiTableCell-root': {
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        },
                    }}>
                        <TableHead>
                            <TableRow>
                                <TableCell padding='checkbox'>
                                    {multiple && (
                                        <Checkbox
                                            disableRipple
                                            indeterminate={selectedFiles.length > 0 && selectedFiles.length < (directoryListing?.files.length ?? 0)}
                                            checked={(directoryListing?.files.length ?? 0) > 0 && selectedFiles.length === directoryListing?.files.length}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    setSelectedFiles(directoryListing?.files || []);
                                                } else {
                                                    setSelectedFiles([]);
                                                }
                                            }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        <Box>Name</Box>
                                        <OutlinedInput
                                            placeholder="Filter"
                                            fullWidth
                                            size="small"
                                            startAdornment={<SearchIcon fontSize="small" sx={{ mr: 0.5 }} />}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            sx={{ fontSize: '13px', minHeight: '0' }}
                                        />
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ textAlign: 'right' }}>Modified</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {directoryListing?.files
                                .filter(file => file.is_dir)
                                .map((file) => (
                                    <DirectoryRow 
                                        key={file.path}
                                        file={file}
                                        onPathChange={(path) => { setCurrentPath(path); setSelectedFiles([]); }}
                                    />
                                ))}
                            {directoryListing?.files
                                .filter(file => !file.is_dir)
                                .map((file) => (
                                    <FileRow
                                        key={file.path}
                                        file={file}
                                        isSelected={selectedFiles.some(f => f.path === file.path)}
                                        onFileClick={handleFileClick}
                                    />
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ width: '384px', overflow: 'hidden' }}>
                    {selectedFiles.length > 0 && (
                        <img src={`${config.serverAddress}/preview?file=${encodeURIComponent(selectedFiles[0]?.path)}&width=384&height=384`} alt={selectedFiles[0]?.name ?? ''} width="100%" />
                    )}
                    <Typography sx={{ fontWeight: 'bold' }}>{selectedFiles[0] ? selectedFiles[0]?.name : ''}</Typography>
                    <Typography>Size: {selectedFiles[0]?.size ? formatFileSize(selectedFiles[0]?.size) : '-'}</Typography>
                    <Typography>Modified: {selectedFiles[0]?.modified ? formatDate(selectedFiles[0]?.modified) : '-'}</Typography>                    
                    <Typography>Type: {selectedFiles[0]?.type ?? ''}</Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { setSelectedFiles([]); onClose(); setCurrentPath('.'); setSearch(''); }}>Cancel</Button>
                <Button
                    onClick={() => { 
                        if (opener?.updateStore) {
                            opener.updateStore(opener.fieldKey, selectedFiles.map(file => file.path));
                        }
                        onSelect?.(selectedFiles.map(file => file.path));
                        setSelectedFiles([]); 
                        onClose();
                        setCurrentPath('.');
                        setSearch('');
                    }}
                    disabled={selectedFiles.length === 0}
                    variant="contained"
                >
                    Select
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default FileBrowserDialog;