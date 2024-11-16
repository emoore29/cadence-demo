import { createTheme, MantineProvider, rem } from "@mantine/core";
import "@mantine/core/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({
  headings: {
    fontFamily: "Greycliff CF, sans-serif",
    sizes: {
      h1: { fontSize: rem(36) },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>
);
