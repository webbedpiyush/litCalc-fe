import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage";
import "@/index.css";
import { MantineProvider } from "@mantine/core";
import { useEffect } from "react";
import axios from "axios";

const paths = [
  {
    path: "/",
    element: <HomePage />,
  },
];

const browserRouter = createBrowserRouter(paths);
export default function App() {
  useEffect(function () {
    async function startTheServer() {
      await axios({
        method: "get",
        url: `${import.meta.env.VITE_API_URL}`,
      });
    }

    startTheServer();
  }, []);

  return (
    <MantineProvider>
      <RouterProvider router={browserRouter}></RouterProvider>
    </MantineProvider>
  );
}
