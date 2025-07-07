import { createContext } from "react";
import { useWebsocketStore, WebsocketState } from "../stores/useWebsocketStore";

export const WebsocketContext = createContext<WebsocketState | null>(null);

export const WebsocketProvider = ({ children }: { children: React.ReactNode }) => {
  const store = useWebsocketStore();
  return <WebsocketContext.Provider value={store}>{children}</WebsocketContext.Provider>;
};
