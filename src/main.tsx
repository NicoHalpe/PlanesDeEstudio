import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<MantineProvider defaultColorScheme="dark">
			<ModalsProvider>
				<App />
			</ModalsProvider>
		</MantineProvider>
	</React.StrictMode>
);
