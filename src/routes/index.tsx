import Dashboard from "@/pages/Dashboard";
import Musics from "@/pages/Musics";
import Root from "@/pages/Root";
import Worships from "@/pages/Worships";
import { createBrowserRouter, redirect } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        index: true,
        loader: async () => redirect("/dashboard"),
      },
      {
        path: "worships",
        element: <Worships />,
      },
      {
        path: "musics",
        element: <Musics />,
      },
    ],
  },
]);
