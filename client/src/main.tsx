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
  colors: {
    dark: [
      "#f9f0f3",
      "#ecdfe3",
      "#dbbbc5",
      "#b2647e",
      "#bd748c",
      "#b5607b", //b5607b
      "#7c324a", //7c324a
      "#9c4661",
      "#8c3d56",
      "#7c324a",
    ],
    darkPink: [
      "#f9f0f3",
      "#ecdfe3",
      "#dbbbc5",
      "#cb94a6",
      "#bd748c",
      "#b5607b",
      "#7c324a",
      "#9c4661",
      "#8c3d56",
      "#7c324a",
    ],
  },
  primaryColor: "darkPink",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Notifications />
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>
);
