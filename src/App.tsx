import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage";
import "@/index.css";
import { MantineProvider } from "@mantine/core";

const paths = [
  {
    path: "/",
    element: <HomePage />,
  },
];

const browserRouter = createBrowserRouter(paths);
export default function App() {
  return (
    <MantineProvider>
      <RouterProvider router={browserRouter}></RouterProvider>;
    </MantineProvider>
  );
}
