import React from "react";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { FieldProps } from "../NodeContent";
import config from "../../../config";
import { useTheme } from "@mui/material/styles";

const DynamicComponent = ({ component, props }: { component: string | undefined, props: any }) => {
    const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);
    const w = window as any;
    const componentId = component?.split('/').pop();
    if (!component || !componentId) {
        console.error('The component must be in the format of `module/component`');
        return <Box>Error loading component</Box>;
    }

    useEffect(() => {
        // expose React to the custom component
        if (w.React === undefined) {
            w.React = React;
        }

        // Track script instances globally
        if (w.mellonCustomScripts === undefined) {
            w.mellonCustomScripts = new Map();
        }

        const loadComponent = async () => {
            try {
                // check if the script is already loaded
                const existingScript = w.mellonCustomScripts.get(component);
                if (existingScript) {
                    await existingScript;
                } else {
                    const loadPromise = new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = `http://${config.serverAddress}/custom_component/${component}`;
                        script.async = true;
                        script.onload = resolve;
                        script.onerror = reject;
                        script.id = componentId;
                        document.body.appendChild(script);
                    });

                    // Wait for script to load
                    w.mellonCustomScripts.set(component, loadPromise);
                    await loadPromise;
                }

                const LoadedComponent = w[componentId];
                if (!LoadedComponent) {
                    throw new Error(`Component ${componentId} failed to load properly`);
                }

                setComp(() => LoadedComponent);
            } catch (error) {
                console.error('Error loading component:', error);
                w.mellonCustomScripts.delete(component);
            }
        };

        // if the componentId is already in the window, use it
        const existingComponent = w[componentId];
        if (existingComponent) {
            setComp(() => existingComponent);
        } else {
            loadComponent();
        }

        // Cleanup
        return () => {
            const script = document.getElementById(componentId);
            if (script && !document.querySelector(`[data-component="${componentId}"]`)) {
                document.body.removeChild(script);
                w.mellonCustomScripts.delete(component);
            }
            // if mellonCustomScripts is empty we can also remove React from the window
            if (w.mellonCustomScripts.size === 0) {
                delete w.mellonCustomScripts;
                delete w.React;
            }
        };
    }, [component, componentId]);

    if (!Comp) {
        return <Box>Loading...</Box>;
    }

    return (
        <Box data-component={componentId}>
            <Comp {...props} />
        </Box>
    );
};


const CustomField = ({ fieldKey, value, style, disabled, hidden, label, updateStore, source }: FieldProps) => {
    const setValue = (v: any) => updateStore?.(fieldKey, v);
    const theme = useTheme();

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
                    setValue,
                    theme,
                }}
            />
        </Box>
    );
}

export default CustomField;