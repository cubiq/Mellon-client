import React from "react";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { FieldProps } from "../NodeContent";

import config from "../../../config";

const DynamicComponent = ({ component, props }: { component: string | undefined, props: any }) => {
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

    if (!component) {
        console.error('No custom component source provided');
        return <Box>No custom component source provided</Box>;
    }

    useEffect(() => {
        const script = document.createElement('script');

        const loadComponent = async () => {
            try {
                const url = `http://${config.serverAddress}/custom_component/${component}`;
                script.src = url;
                script.async = true;

                (window as any).React = React;

                // Wait for script to load
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });

                const LoadedComponent = (window as any).MyComponent;
                setComponent(() => LoadedComponent);
            } catch (error) {
                console.error('Error loading component:', error);
            }
        };

        loadComponent();

        // Cleanup
        return () => {
            document.body.removeChild(script);
        };
    }, [component]);

    if (!Component) {
        return <Box>Loading component: {component}...</Box>;
    }

    return <Component {...props} />;
};


const CustomField = ({ fieldKey, value, style, disabled, hidden, label, updateStore, source }: FieldProps) => {
    const nodeActions = {
        setValue: (v: any) => updateStore?.(fieldKey, v),
        updateStore: updateStore,
    }
    return (
        <Box
            data-key={fieldKey}
            className={`nodrag nowheel ${disabled ? 'mellon-disabled' : ''} ${hidden ? 'mellon-hidden' : ''}`}
            sx={{ ...style }}
        >
            <DynamicComponent
                component={source}
                props={{
                    fieldKey,
                    value,
                    label,
                    nodeActions,
                }}
            />
        </Box>
    );
}

export default CustomField;