# Mellon Client

This is the development client for the [Mellon](https://github.com/cubiq/Mellon) engine. It is built with [ReactFlow](https://reactflow.dev/), [Typescript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) and [MUI](https://mui.com/).

> [!CAUTION]
> This is mostly a proof of concept and not a production ready application. **DO NOT USE** unless you know what you are doing. Things will change often.

## Install

```bash
git clone https://github.com/cubiq/Mellon-client.git
cd Mellon-client
npm install
```

You can create a `.env.development` file and put the server address in it, like so (change the address/port if needed):

```
VITE_SERVER_ADDRESS=127.0.0.1:8088
```

**Note:** that is the Mellon server address, not the client! It's likely `127.0.0.1` (localhost), but you might need to change it if your server is at a different location.

You can add custom Vite configurations creating a `vite.config.local.ts` file. For example if your Vite installation is on a remote server you could add a `server` section:

```ts
import { UserConfig } from 'vite'

const localConfig: UserConfig = {
  server: {
    hmr: true,
    watch: {
      usePolling: true,
    },
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
}

export default localConfig
```

Then you can start the development server with:

```bash
npm run dev
```

**Remember** to `npm install` every time `package.json` is updated!

When done you need to run `npm run build` and copy the compiled directory into the `web` folder of [Mellon](https://github.com/cubiq/Mellon) server.

## Custom fields

Mellon allows developing custom fields in React. Check `custom-fields/ExampleField.tsx` for an example implementation. The following is a skeleton to start from.

```tsx
import { FieldProps } from "../components/NodeContent";

export default function ExampleField(props: FieldProps) {  
    return (
        <Box
            data-key={props.fieldKey}
            className={`${props.hidden ? 'mellon-hidden' : ''} ${props.disabled ? 'mellon-disabled' : ''}`}
            sx={{
                width: '100%',
                ...props.style,
            }}
        >
        ...
        </Box>
    )
}
```

If you want to override the default wheel and drag events add the classes `nowheel` and `nodrag` to the top most element.

You can send custom values from the `MODULE_MAP` on the server to the custom field with the property `props.fieldOptions.whatever`.

Custom fields are dynamically loaded and are not as performant as default fields. If the field is generic enough consider adding it the core components and send a PR.

## Contact

At this stage the best way to contact me regarding the project is via [X/Twitter](https://x.com/cubiq) or [discord](https://latent.vision/discord).
