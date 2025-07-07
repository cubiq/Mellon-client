/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SERVER_ADDRESS: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}