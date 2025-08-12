import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
    children?: ReactNode;
    module?: string;
    action?: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: any) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error: any, _info: any) {
        console.error(error);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <div style={{ color: 'rgb(240,40,0)', fontSize: '16px', padding: '8px 10px', border: '1px solid rgb(240,40,0)' }}>Something went wrong while rendering module <span style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '0px 4px', display: 'inline-block' }}>{this.props.module}</span> action <span style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '0px 4px', display: 'inline-block' }}>{this.props.action}</span>. Please check the browser console and report the incident.</div>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
