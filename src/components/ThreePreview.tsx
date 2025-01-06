// @ts-nocheck
// TODO: can't make it work with typescript
import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import { useWebSocket } from './WebsocketContext';

function Model({ url }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

function base64ToBlob(base64, contentType = "", sliceSize = 512) {
    const byteCharacters = atob(base64.split(",")[1]);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length;
        offset += sliceSize) {
        const slice = byteCharacters.slice(
            offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

export default function ThreePreview({ nodeId, dataKey, width = 512, height = 512, ...props }) {
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const { threeData } = useWebSocket();

    const modelValue = threeData[`${nodeId}-${dataKey}`];

    useEffect(() => {
        if (!modelValue) {
            setModelUrl(null);
            return;
        }

        if (modelValue.startsWith('data:')) {
            // Convert base64 to blob URL
            const blob = base64ToBlob(modelValue, 'model/gltf-binary');
            const blobUrl = URL.createObjectURL(blob);
            setModelUrl(blobUrl);

            // Cleanup function
            return () => {
                URL.revokeObjectURL(blobUrl);
                if (modelUrl) {
                    useGLTF.clear(modelUrl);
                }
            };
        } else {
            setModelUrl(modelValue);
            return () => {
                if (modelUrl) {
                    useGLTF.clear(modelUrl);
                }
            };
        }

    }, [modelValue]);

    return (
        <div style={{ position: 'relative', width, height }} {...props}>
            <Canvas style={{ background: '#333333' }}>
                <Suspense fallback={null}>
                    <directionalLight position={[5, 5, 5]} intensity={3} />
                    {modelUrl && <Model url={modelUrl} />}
                    <OrbitControls />
                    <Environment preset="warehouse" background={false} />
                </Suspense>
            </Canvas>
        </div>
    );
}