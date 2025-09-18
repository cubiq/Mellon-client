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
            return (
                <div style={{ color: 'rgb(240,40,0)', fontSize: '16px', padding: '8px 10px', border: '1px solid rgb(240,40,0)', maxWidth: '480px' }}>
                    Something went wrong while rendering module `{this.props.module}` action `{this.props.action}`.
                    Please check the browser console and report the incident.
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
