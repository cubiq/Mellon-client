import { useState } from "react";
import { useSettingsStore } from '../stores/useSettingsStore';
import { useFlowStore } from "../stores/useFlowStore";
import { useTaskStore } from "../stores/useTaskStore";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import FormControl from "@mui/material/FormControl";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import LinearProgress from "@mui/material/LinearProgress";
import DialogActions from "@mui/material/DialogActions";
import ListItemIcon from "@mui/material/ListItemIcon";
import IconButton from "@mui/material/IconButton";

import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import config from "../../app.config";
import { enqueueSnackbar } from "notistack";

const SettingsDialog = ({opener, onClose}: {opener: boolean | null, onClose: () => void}) => {
    const { edgeType, setEdgeType, resetToDefault } = useSettingsStore();
    const setAllEdgesType = useFlowStore(state => state.setAllEdgesType);

    const { queuedTasks, currentTask, taskCount } = useTaskStore();

    const [tab, setTab] = useState(0);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handleLineTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as 'default' | 'smoothstep';
        setEdgeType(value);
        setAllEdgesType(value);
    };

    const handleResetToDefault = () => {
        resetToDefault();
        setAllEdgesType('default');
    };

    const handleCancelTask = async (task_id: string) => {
        try {
            const response = await fetch(`${config.serverAddress}/queue/${task_id}`, { method: 'DELETE' });
            if (!response.ok) {
                enqueueSnackbar('Failed to cancel task', { variant: 'error', autoHideDuration: 1500 });
                //throw new Error('Failed to cancel task');
            }
        } catch (error) {
            console.error('Failed to cancel task', error);
            enqueueSnackbar('Failed to cancel task', { variant: 'error', autoHideDuration: 1500 });
        }
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
            <DialogTitle component="div" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.22)', p:0 }}>
                <Tabs
                    value={tab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiButtonBase-root': { fontSize: '16px', px: 3, py: 2 },
                        '& .Mui-selected': { backgroundColor: 'rgba(0, 0, 0, 0.28)' },
                    }}
                >
                    <Tab label="Preferences" />
                    <Tab label="Tasks" />
                    <Tab label="About" />
                </Tabs>
            </DialogTitle>
            <DialogContent sx={{ px: 2, pb: 2 }}>
                {tab === 0 && (
                    <TableContainer sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Table sx={{ width: 'auto' }}>
                            <TableBody sx={{
                                        '& .MuiTableCell-root': {
                                            py: 1, px: 2,
                                            fontSize: '16px',
                                            borderBottomColor: 'transparent',
                                        },
                                        '& th': {
                                            width: '22%',
                                            textAlign: 'right',
                                            whiteSpace: 'nowrap',
                                            fontWeight: 'bold'
                                        },
                                    }}
                                >
                                <TableRow>
                                    <TableCell component="th">Line type</TableCell>
                                    <TableCell>
                                        <FormControl>
                                            <RadioGroup row value={edgeType} onChange={handleLineTypeChange}>
                                                <FormControlLabel value="default" control={<Radio />} label="Curve" />
                                                <FormControlLabel value="smoothstep" control={<Radio />} label="Step" />
                                            </RadioGroup>
                                        </FormControl>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th">Local storage</TableCell>
                                    <TableCell>
                                        <Button variant="outlined" color="primary" startIcon={<DeleteIcon />} onClick={handleResetToDefault}>Reset to default</Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {tab === 1 && (
                    <Box sx={{ width: '100%' }}>
                        <List sx={{
                            '& .MuiListItem-root': {
                                borderBottom: '1px solid',
                                borderColor: 'secondary.light',
                                py: 1.5,
                            },
                        }}>
                            <ListItem>
                                <ListItemText sx={{ textAlign: 'center', color: 'success.main', fontWeight: 'bold' }} primary={`${taskCount ? taskCount : 'No'} tasks queued`} />
                            </ListItem>
                            
                            {currentTask && (
                                <ListItem>
                                    <ListItemIcon sx={{ minWidth: '0', pr: 2 }}><DirectionsRunIcon /></ListItemIcon>
                                    <ListItemText
                                        sx={{ pr: 1 }}
                                        primary={`[${currentTask.task_id?.substring(0, 6)}] ${currentTask.name}`}
                                        secondary={<LinearProgress
                                            variant="determinate"
                                            value={currentTask.progress}
                                            sx={{
                                                width: '250px',
                                                height: '3px',
                                                mt: 0.5,
                                                '& .MuiLinearProgress-bar': { transition: '60ms' }
                                            }}
                                        />}
                                    />
                                </ListItem>
                            )}
                            {Object.entries(queuedTasks).map(([task_id, task]) => (
                                <ListItem key={task_id} secondaryAction={<IconButton sx={{ color: 'error.main', border: '1px solid', borderColor: 'error.main', borderRadius: 0.5 }} onClick={() => handleCancelTask(task_id)}><DeleteIcon fontSize="small" /></IconButton>}>
                                    <ListItemIcon sx={{ minWidth: '0', pr: 2 }}><WatchLaterOutlinedIcon /></ListItemIcon>
                                    <ListItemText
                                        sx={{ pr: 1 }}
                                        primary={`[${task_id.substring(0, 6)}] ${task.name}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
                {tab === 2 && (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6"><b>Mellon</b>, AI without the hype.</Typography>
                            <Typography variant="body1">This page will get better, I promise.</Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 1, justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.22)' }}>
                <Button variant="outlined" color="primary" onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default SettingsDialog;