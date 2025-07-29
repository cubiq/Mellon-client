import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FieldProps } from "../components/NodeContent";
import { useEffect, useRef } from "react";
import { useStore } from '@xyflow/react';
import Button from "@mui/material/Button";

export default function SplineField(props: FieldProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const localPointsRef = useRef<{ x: number, y: number }[]>([]);
    const splineRef = useRef<{ x: number, y: number, b: number, c: number, d: number }[] | null>(null);

    const draggingPointIndexRef = useRef<number | null>(null);
    const zoomLevel = useStore((store) => store.transform[2]);

    const BASE_SIZE = 320;
    const POINT_HIT_RADIUS = 12;
    const GRID_COLOR = 'rgba(255, 255, 255, 0.1)';
    const GRID_SIZE = 10;
    const SPLINE_COLOR = '#213b44';
    const POINT_COLOR = '#ffb300';
    const POINT_RADIUS = 6;
    const LINE_HIT_RADIUS = 7;
    const MIN_X_DISTANCE = 3;

    function calculateNaturalCubicSpline() {
        const points = localPointsRef.current;
        const n = points.length - 1;
        if (n < 1) return [];
        for (let i = 0; i < n; i++) {
            if (points[i+1].x <= points[i].x) return [];
        }
        const x = points.map(p => p.x);
        const y = points.map(p => p.y);
        const h = new Array(n);
        for (let i = 0; i < n; i++) h[i] = x[i + 1] - x[i];
        const alpha = new Array(n);
        for (let i = 1; i < n; i++) {
            alpha[i] = (3 / h[i]) * (y[i + 1] - y[i]) - (3 / h[i - 1]) * (y[i] - y[i - 1]);
        }
        const c = new Array(n + 1).fill(0);
        const l = new Array(n + 1).fill(1);
        const mu = new Array(n + 1).fill(0);
        const z = new Array(n + 1).fill(0);
        for (let i = 1; i < n; i++) {
            l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1];
            mu[i] = h[i] / l[i];
            z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
        }
        for (let j = n - 1; j >= 0; j--) c[j] = z[j] - mu[j] * c[j + 1];
        const segments = new Array(n);
        for (let i = 0; i < n; i++) {
            const d = (c[i + 1] - c[i]) / (3 * h[i]);
            const b = (y[i + 1] - y[i]) / h[i] - h[i] * (c[i + 1] + 2 * c[i]) / 3;
            segments[i] = { x: x[i], y: y[i], b: b, c: c[i], d: d };
        }
        return segments;
    }
    
    function evaluateSpline(x_val: number) {
        const splineSegments = splineRef.current;
        if (!splineSegments || splineSegments.length === 0) return null;
        let segmentIndex = splineSegments.findIndex(s => s.x > x_val) - 1;
        if (segmentIndex < 0) segmentIndex = splineSegments.length - 1;
        const s = splineSegments[segmentIndex];
        if (!s) return null;
        const dx = x_val - s.x;
        return s.y + s.b * dx + s.c * dx * dx + s.d * dx * dx * dx;
    }
    
    // TODO: in some edge cases, the point is not found when clicking on the canvas. Maybe rounding issues?
    function findPoint(mouseX: number, mouseY: number) {
        const points = localPointsRef.current;
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            // the first and last points have a larger hitbox to make them easier to select
            const hit_radius = i === 0 || i === points.length - 1 ? POINT_HIT_RADIUS*1.25 : POINT_HIT_RADIUS;
            if (dx * dx + dy * dy < hit_radius * hit_radius) return p;
        }
        return null;
    }

    function draw() {
        const points = localPointsRef.current;
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const dpr = window.devicePixelRatio || 1;
        const zoom = Math.max(0.4, Math.min(zoomLevel, 1.4));

        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1 * dpr * zoom;
        //ctx.setLineDash([5, 5]); // dotted grid
        for (let i = 0; i < GRID_SIZE; i++) {
            const x = i * w / GRID_SIZE;
            const y = i * h / GRID_SIZE;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        if (points.length < 2) return;
        //ctx.setLineDash([]); // solid spline
        const startPoint = points[0];
        const endPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.strokeStyle = SPLINE_COLOR;
        ctx.lineWidth = 2.5 * dpr * zoom;
        const clampedStartY = Math.max(0, Math.min(h, startPoint.y));
        ctx.moveTo(0, clampedStartY);
        ctx.lineTo(startPoint.x, clampedStartY);
        if (splineRef.current && splineRef.current.length > 0) {
            for (let x = Math.ceil(startPoint.x); x <= Math.floor(endPoint.x); x++) {
                const y = evaluateSpline(x);
                if (y !== null) {
                    const clampedY = Math.max(0, Math.min(h, y));
                    ctx.lineTo(x, clampedY);
                }
            }
        }
        const clampedEndY = Math.max(0, Math.min(h, endPoint.y));
        ctx.lineTo(endPoint.x, clampedEndY);
        ctx.lineTo(w, clampedEndY);
        ctx.stroke();
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, POINT_RADIUS * dpr * zoom, 0, 2 * Math.PI);
            ctx.fillStyle = POINT_COLOR;
            ctx.fill();
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2 * dpr * zoom;
            ctx.stroke();
        });
    }

    function handleMouseDown(e: MouseEvent) {
        if (e.button !== 0) return;
        const canvas = canvasRef.current;
        if (canvas == null) return;
    
        const mousePos = getMousePos(e);
        const points = localPointsRef.current;
        const point = findPoint(mousePos.x, mousePos.y);
    
        if (point !== null) {
            draggingPointIndexRef.current = points.indexOf(point);
        } else {
            const startPoint = points[0];
            const endPoint = points[points.length - 1];
            if (mousePos.x > startPoint.x && mousePos.x < endPoint.x) {
                const yOnSpline = evaluateSpline(mousePos.x);
                if (yOnSpline !== null && Math.abs(yOnSpline - mousePos.y) < LINE_HIT_RADIUS) {
                    const newPoint = { x: mousePos.x, y: yOnSpline };
                    const newPoints = [...points, newPoint];
                    newPoints.sort((a, b) => a.x - b.x);
                    draggingPointIndexRef.current = newPoints.indexOf(newPoint); // Store the index of the new point
                    updateStore(newPoints);
                }
            }
        }
    
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    function handleMouseMove(e: MouseEvent) {
        const draggingIndex = draggingPointIndexRef.current;
        if (draggingIndex === null) return;
        e.preventDefault();
        e.stopPropagation();
    
        const points = localPointsRef.current;

        if (draggingIndex >= points.length) return;
    
        const draggingPoint = points[draggingIndex];
        const mousePos = getMousePos(e);
        const w = canvasRef.current!.width;
        const h = canvasRef.current!.height;
    
        draggingPoint.x = mousePos.x;
        draggingPoint.y = Math.max(0, Math.min(h, mousePos.y));
        
        // Sort the array so points are in the correct order of x values
        points.sort((a, b) => a.x - b.x);
        
        // find the new index of our point and update the ref
        const newDraggingIndex = points.indexOf(draggingPoint);
        draggingPointIndexRef.current = newDraggingIndex;
    
        const minX = (newDraggingIndex === 0) ? 0 : points[newDraggingIndex - 1].x + MIN_X_DISTANCE;
        const maxX = (newDraggingIndex === points.length - 1) ? w : points[newDraggingIndex + 1].x - MIN_X_DISTANCE;
        draggingPoint.x = Math.max(minX, Math.min(maxX, draggingPoint.x));
    
        // update the store and re-render the canvas
        updateStore(points);
    }

    function handleMouseUp(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        draggingPointIndexRef.current = null; // Clear the index
        const points = localPointsRef.current;
        points.sort((a, b) => a.x - b.x);
        updateStore(points);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    function handleDoubleClick(e: MouseEvent) {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const points = localPointsRef.current;
        if (points.length <= 2) return;
        const mousePos = getMousePos(e);
        const point = findPoint(mousePos.x, mousePos.y);
        if (point) {
            const newPoints = points.filter(p => p !== point);
            updateStore(newPoints);
        }
    }

    function getMousePos(e: MouseEvent) {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        return { 
            x: (e.clientX - rect.left) * dpr, 
            y: (e.clientY - rect.top) * dpr 
        };
    }

    function updateStore(points: { x: number, y: number }[]) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        localPointsRef.current = points;
        // we round to 6 decimal places to avoid floating point pollution
        const newPoints = points.map(p => ({ 
            x: Math.max(0, Math.min(1, parseFloat((p.x / canvas.width).toFixed(6)))), 
            //y: parseFloat((p.y / canvas.height).toFixed(6))
            y: Math.max(0, Math.min(1, parseFloat((1 - (p.y / canvas.height)).toFixed(6)))) // bottom left origin is 0,0
        }));
        props.updateStore(props.fieldKey, newPoints);
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas == null) return;
    
        let points = props.value as { x: number, y: number }[];
        if (!Array.isArray(points) || points.length < 2) {
            const defaultPoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
            props.updateStore(props.fieldKey, defaultPoints);
            return;
        }
        
        const dpr = window.devicePixelRatio || 1;
    
        const width = BASE_SIZE * zoomLevel * dpr;
        const height = BASE_SIZE * zoomLevel * dpr;
    
        canvas.width = width;
        canvas.height = height;
    
        // Scale the normalized points from props to the new canvas resolution.
        // note that we are using canvas.width and canvas.height here, not width and height
        // this ensures that the points are scaled correctly for the actual canvas size that is rounded to the nearest pixel
        localPointsRef.current = points.map(p => ({
            x: p.x * canvas.width,
            y: (1 - p.y) * canvas.height
        }));
    
        splineRef.current = calculateNaturalCubicSpline();
        draw();
    }, [zoomLevel, props.value, props.fieldKey, props.updateStore]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas == null) return;

        ctxRef.current = canvas.getContext('2d');

        const dpr = window.devicePixelRatio || 1;
        const height = BASE_SIZE * dpr * zoomLevel;
        const width = BASE_SIZE * dpr * zoomLevel;
        canvas.width = width;
        canvas.height = height;

        const points = props.value as { x: number, y: number }[] || [{ x: 0, y: 0 }, { x: 1, y: 1 }];
        localPointsRef.current = points.map(p => ({
            x: p.x * canvas.width,
            y: (1 - p.y) * canvas.height
        }));
        splineRef.current = calculateNaturalCubicSpline();
        draw();

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('dblclick', handleDoubleClick);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('dblclick', handleDoubleClick);
        }
    }, []);

    return (
        <Box
            sx={{
                width: '100%',
                ...props.style,
            }}
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} mellon-field nodrag`}
        >
            <Typography sx={{ fontSize: 13, color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.label}>{props.label}</Typography>
            <Box sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Box sx={{ width: `${BASE_SIZE}px`, border: '1px solid', borderColor: 'divider', borderRadius: 0.5, overflow: 'hidden', m: 0, p: 0 }}>
                    <canvas ref={canvasRef} style={{ width: `${BASE_SIZE}px`, aspectRatio: '1/1', cursor: 'crosshair', display: 'block' }}></canvas>
                </Box>
                <Box sx={{ width: '100%', mt: 1 }}>
                    <Button variant="contained" color="secondary" size="small" sx={{ minWidth: '0', minHeight: '0', lineHeight: '1', px: 1.5, py: 0.75 }} onClick={() => {
                        props.updateStore(props.fieldKey, [{ x: 0, y: 0 }, { x: 1, y: 1 }]);
                    }}>Reset</Button>
                </Box>
            </Box>
        </Box>
    );
}