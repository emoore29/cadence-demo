import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <Notifications />
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>
);
