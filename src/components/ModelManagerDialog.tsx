import { useCallback, useEffect, useState } from "react";

import { enqueueSnackbar } from 'notistack';

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";

import config from '../../app.config';
import DialogContent from "@mui/material/DialogContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import IconButton from "@mui/material/IconButton";
import DeleteIcon from '@mui/icons-material/Delete';
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import OutlinedInput from "@mui/material/OutlinedInput";
import SvgIcon from '@mui/material/SvgIcon';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DialogActions from "@mui/material/DialogActions";

import { useSettingsStore } from "../stores/useSettingsStore";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import SearchIcon from '@mui/icons-material/Search';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DownloadIcon from '@mui/icons-material/Download';


interface Revision {
    'hash': string;
    'size': number;
    'last_modified': number;
}

interface HFModel {
    'id': string;

    // For the Cache
    'type': string;
    'size': number;
    'last_accessed': number;
    'revisions': Revision[];
    'class_names': string[];

    // For the Hub
    'created_at': number;
    'last_modified': number;
    'private': boolean;
    'downloads': number;
    'likes': number;
    'gated': boolean;
    'tags': string[];
    'pipeline_tag': string;
}

function ModelManagerDialog({
    opener,
    onClose,
}: {
    onClose: () => void,
    opener: { nodeId: string | null, fieldKey: string | null } | null,
}) {
    const { setAlertOpener } = useSettingsStore();
    const [_isLoading, setIsLoading] = useState<boolean>(false);
    const [hfCache, setHfCache] = useState<HFModel[]>([]);
    const [hfHub, setHfHub] = useState<HFModel[]>([]);
    const [isOpen, setIsOpen] = useState<string[]>([]);
    const [tab, setTab] = useState<number>(0);
    const [cacheSearch, setCacheSearch] = useState<string>('');
    const [hubSearch, setHubSearch] = useState<string>('');

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const fetchHfCache = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${config.serverAddress}/hf_cache`);
            const data = await response.json();
            if (cacheSearch) {
                setHfCache(data.filter((model: HFModel) => model.id.toLowerCase().includes(cacheSearch.toLowerCase())));
            } else {
                setHfCache(data);
            }
        } catch (error) {
            console.error('Error fetching Hugging Face models:', error);
        } finally {
            setIsLoading(false);
        }
    }, [config.serverAddress, cacheSearch]);

    const fetchHfHub = useCallback(async () => {
        if (!hubSearch || hubSearch.trim().length < 2) {
            setHfHub([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${config.serverAddress}/hf_hub?q=${hubSearch}`);
            const data = await response.json();
            setHfHub(data);
        } catch (error) {
            const err = `Error fetching Hugging Face models: ${error}`;
            enqueueSnackbar(err, { variant: 'error', autoHideDuration: err.length * 80 });
            console.error('Error fetching Hugging Face models:', error);
        } finally {
            setIsLoading(false);
        }
    }, [config.serverAddress, hubSearch]);

    const deleteHfModel = useCallback(async (hash: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${config.serverAddress}/hf_cache/${hash}`, { method: 'DELETE' });
            const result = await response.json();

            if (result.error) {
                const err = `Error deleting Hugging Face model.`;
                enqueueSnackbar(err, { variant: 'error', autoHideDuration: err.length * 80 });
                console.error(err);
            }

            fetchHfCache();
        } catch (error) {
            console.error('Error deleting Hugging Face model:', error);
        } finally {
            setIsLoading(false);
        }
    }, [config.serverAddress]);

    const downloadHfModel = useCallback(async (repo_id: string) => {
        try {
            const response = await fetch(`${config.serverAddress}/hf_download?repo_id=${repo_id}`);
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Error downloading Hugging Face model:', error);
        } finally {
            console.log('Downloaded Hugging Face model');
        }
    }, [config.serverAddress]);

    useEffect(() => {
        fetchHfCache();
    }, [fetchHfCache]);

    useEffect(() => {
        setIsOpen([]);
    }, [opener]);

    function formatTitle(id: string) {
        return (
            <>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{id.split('/').slice(0, -1).join('/')}</span>
                /
                <strong>{id.split('/').pop()}</strong>
            </>
        );
    }

    function formatFileSize(size: number): string {
        if (size === 0) {
            return '0 B';
        }
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(size) / Math.log(1024));
        return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
    }

    function handleCollapse(modelId: string) {
        setIsOpen(isOpen.includes(modelId) ? isOpen.filter((id) => id !== modelId) : [...isOpen, modelId]);
    }

    return (
        <Dialog
            open={!!opener}
            onClose={onClose}
            fullWidth
            maxWidth="md"
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
            <DialogTitle sx={{ backgroundColor: 'rgba(0, 0, 0, 0.22)', px: 0, pb: 0, pt: 0 }}>
                <Tabs
                    value={tab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiButtonBase-root': { fontSize: '16px', px: 3, py: 2 },
                        '& .Mui-selected': { backgroundColor: 'rgba(0, 0, 0, 0.28)' },
                    }}
                >
                    <Tab label="🤗 HuggingFace Cache" />
                    {false && <Tab label="🤗 HuggingFace Hub" />}
                </Tabs>
            </DialogTitle>
            {tab === 0 && (
            <DialogContent>
                {hfCache.length === 0 && (
                    <Box sx={{ display: 'flex', textAlign: 'center', justifyContent: 'center', py: 3 }}>
                        <Typography variant="h6">The local cache is empty.</Typography>
                    </Box>
                )}
                {hfCache.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 3 }}>
                    <OutlinedInput
                        placeholder="Filter"
                        fullWidth
                        size="small"
                        value={cacheSearch}
                        onChange={(e) => setCacheSearch(e.target.value)}
                        sx={{ width: '100%' }}
                        startAdornment={<SearchIcon fontSize="small" sx={{ mr: 0.5 }} />}
                    />
                </Box>
                )}
                <List sx={{ width: '100%' }}>
                    {hfCache.map((model) => (
                        <Box key={model.id} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <ListItem
                                secondaryAction={
                                    <Button
                                        color="error"
                                        variant="contained"
                                        size="small"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => {
                                            setAlertOpener({
                                                title: 'Confirm deletion',
                                                message: `Delete ${model.id} model?`,
                                                confirmText: 'Delete',
                                                cancelText: 'Cancel',
                                                onConfirm: () => deleteHfModel(model.revisions.map((revision) => revision.hash).join(',')),
                                            });
                                        }}
                                        sx={{
                                            minWidth: 0,
                                            "& .MuiButton-startIcon": { m: 0, p: 0 },
                                        }}
                                    />
                                }
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0 }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontSize: '18px', mb: 0.5 }}>{formatTitle(model.id)}</Typography>
                                        <Typography variant="body1" sx={{ fontSize: '14px', mb: 0.5 }}><span>Size:</span> <strong>{formatFileSize(model.size)}</strong> - <span>Last Accessed:</span> <strong>{new Date(model.last_accessed * 1000).toLocaleString()}</strong></Typography>
                                    </Box>
                                    <Box>
                                    {model.class_names.map((name) => (
                                        <Chip key={name} color="secondary" size="small" label={name} sx={{ fontSize: '14px', mr: 0.5, my: 0.5, borderRadius: 1 }} />
                                    ))}
                                    </Box>
                                    <Box>
                                        <Button size="small" onClick={() => handleCollapse(model.id)} endIcon={isOpen.includes(model.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}>Revisions</Button>
                                    </Box>
                                </Box>
                            </ListItem>
                            <Collapse
                                in={isOpen.includes(model.id)}
                                timeout="auto"
                                unmountOnExit
                                sx={{
                                    '& .MuiList-root, & .MuiListItem-root, & .MuiListItemText-root': {
                                        p: 0,
                                        m: 0,
                                    },
                                    '& .MuiListItem-root': {
                                        pl: 4,
                                        pb: 2,
                                    },
                                }}
                            >
                                <List>
                                    {model.revisions.map((revision) => (
                                        <ListItem key={revision.hash} sx={{ '& .MuiListItemText-root': { p: 0, m: 0 } }}>
                                            <ListItemText primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                                                    <Box><strong>{revision.hash.slice(0, 8)}</strong> - Modified: {new Date(revision.last_modified * 1000).toLocaleString()} - Size: {formatFileSize(revision.size)}</Box>
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => {
                                                            setAlertOpener({
                                                                title: 'Confirm deletion',
                                                                message: `Delete ${revision.hash.slice(0, 8)} revision of ${model.id} model?`,
                                                                confirmText: 'Delete',
                                                                cancelText: 'Cancel',
                                                                onConfirm: () => deleteHfModel(revision.hash)
                                                            });
                                                        }}
                                                        sx={{
                                                            ml: 1,
                                                            height: '24px',
                                                            width: '24px',
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            } />
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        </Box>
                    ))}
                </List>
            </DialogContent>
            )}
            {tab === 1 && (
                <DialogContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 3, gap: 1 }}>
                        <OutlinedInput
                            placeholder="Search"
                            fullWidth
                            size="small"
                            value={hubSearch}
                            onChange={(e) => setHubSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    fetchHfHub();
                                }
                            }}
                            sx={{ width: '100%' }}
                        />
                        <Button variant="contained" color="primary" onClick={() => fetchHfHub()} startIcon={<SearchIcon />}>Search</Button>
                    </Box>
                    <List sx={{ width: '100%' }}>
                        {hfHub.map((model) => (
                            <Box key={model.id} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <ListItem
                                    secondaryAction={
                                        <Button
                                            color="success"
                                            variant="contained"
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            onClick={() => downloadHfModel(model.id)}
                                            sx={{
                                                minWidth: 0,
                                                "& .MuiButton-startIcon": { m: 0, p: 0 },
                                            }}
                                        >
                                            Download
                                        </Button>
                                    }
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6" sx={{ fontSize: '18px', mb: 0.5 }}>{formatTitle(model.id)}</Typography>
                                            {model.private && (
                                            <SvgIcon titleAccess="Private" color="info">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            </SvgIcon>
                                            )}
                                            {model.gated && (
                                                <LockOutlinedIcon titleAccess="Gated" color="error" />
                                            )}
                                        </Box>

                                        <Typography variant="body1" sx={{ fontSize: '14px', mb: 0.5 }}>Last modified: <strong>{model.last_modified ? new Date(model.last_modified * 1000).toLocaleString() : model.created_at ? new Date(model.created_at * 1000).toLocaleString() : '-'}</strong></Typography>
                                        <Box>
                                            <Chip label={`Downloads: ${model.downloads}`} color="secondary" size="small" sx={{ fontSize: '14px', mr: 0.5, my: 0.5, borderRadius: 1 }} />
                                            <Chip label={`Likes: ${model.likes}`} color="secondary" size="small" sx={{ fontSize: '14px', mr: 0.5, my: 0.5, borderRadius: 1 }} />
                                        </Box>
                                    </Box>
                                </ListItem>
                            </Box>
                        ))}
                    </List>
                </DialogContent>
            )}
            <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
                <Button variant="outlined" color="primary" onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ModelManagerDialog;