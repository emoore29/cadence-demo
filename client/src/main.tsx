import { createTheme, MantineProvider, rem, Skeleton } from "@mantine/core";
import "@mantine/core/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";
import GradientBackground from "./components/GradientBackground/gradientBackground.tsx";

const theme = createTheme({
  components: {
    Table: {
      styles: {
        td: {
          padding: "5px 0",
        },
        th: {
          padding: "5px 0",
        },
      },
    },
    Button: {
      styles: {},
    },
    Tabs: {
      styles: {
        panel: {
          margin: "20px 0",
        },
      },
    },
    RadioGroup: {
      styles: {
        label: {
          visibility: "hidden",
        },
      },
    },
  },
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
      "#aa7687", // inactive radio button label
      "#844358", // form accordion borders, input borders
      "#aa7687", // inactive radio button background
      "#6c2248", // input background colors, dropdown menu background color
      "#4b102e", // pills color, tab 'invisible' bottom border color
      "#8c3d56",
      "#7c324a",
    ],
    darkPink: [
      "#f9f0f3",
      "#ecdfe3",
      "#dbbbc5",
      "#b2647e",
      "#bd748c",
      "#b5607b",
      "#7c324a",
      "#9c4661",
      "#8E2855", // active tab border, button backgrounds
      "#a62f64", // button hover background
    ],
  },
  primaryColor: "darkPink",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Notifications />
      <ModalsProvider>
        <GradientBackground>
          <App />
        </GradientBackground>
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>
);
