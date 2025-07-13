import { create } from "zustand";
import config from "../../app.config";

export type Task = {
    name: string;
    queued_at?: number;
    started_at?: number;
    completed_at?: number;
    progress?: number;
    sid?: string;
    task_id?: string;
}

interface TaskState {
    queuedTasks: Record<string, Task>;
    currentTask: Task | undefined;
    taskCount: number;
}

interface TaskActions {
    setTasks: (current: Task | undefined, queued: Record<string, Task>) => void;
    fetchTasks: () => Promise<void>;
    updateProgress: (task_id: string, progress: number) => void;
    //getCurrentTask: () => Task | undefined;
}

export const useTaskStore = create<TaskState & TaskActions>((set, get) => ({
    queuedTasks: {},
    currentTask: undefined,
    taskCount: 0,

    fetchTasks: async () => {
        try {
            const response = await fetch(`${config.serverAddress}/queue`);
            const data = await response.json();
            get().setTasks(data.current, data.queued);
        } catch (error) {
            console.error(error);
        }
    },

    setTasks: (current, queued) => {
        set({ queuedTasks: queued, currentTask: current, taskCount: Object.keys(queued).length + (current ? 1 : 0) });
    },

    updateProgress: (task_id, progress) => {
        const currentTask = get().currentTask;
        if (currentTask === undefined || task_id !== currentTask.task_id) {
            return;
        }

        set({ currentTask: { ...currentTask, progress } });
    },
}));