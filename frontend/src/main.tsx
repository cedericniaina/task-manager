import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import "./index.css";
import App from "./App.tsx";
import Home from "./page/Home.tsx";
import Project from "./page/Project.tsx";
import ProjectForm from "./page/Form/ProjectForm.tsx";
import Login from "./page/auth/Login.tsx";
import Signin from "./page/auth/Signin.tsx";
import Individu from "./page/Individu.tsx";
import IndividuForm from "./page/Form/IndividuForm.tsx";
import Tache from "./page/Tache.tsx";
import TacheForm from "./page/Form/TacheForm.tsx";
import Profile from "./page/Profile.tsx";
import Dashboard from "./page/Dashboard.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: "/home",
        element: <Home></Home>,
      },
      {
        path: "/dashboard",
        element: <Dashboard></Dashboard>,
      },
      // ========================== PROJECT
      {
        path: "/project",
        element: <Project></Project>,
      },
      {
        path: "/project/form",
        element: <ProjectForm></ProjectForm>,
      },
      {
        path: "/project/:id_projet/edit",
        element: <ProjectForm></ProjectForm>,
      },
      // =========================== INDIVIDUE
      {
        path: "/individu",
        element: <Individu></Individu>,
      },
      {
        path: "/individu/form",
        element: <IndividuForm></IndividuForm>,
      },
      {
        path: "/individu/:id_individue/edit",
        element: <IndividuForm></IndividuForm>,
      },
      //============================ TACHE
      {
        path: "/tache",
        element: <Tache></Tache>,
      },
      {
        path: "/tache/form",
        element: <TacheForm></TacheForm>,
      },
      {
        path: "/tache/:id_tache/edit",
        element: <TacheForm></TacheForm>,
      },
      // =========================== PROFILE
      {
        path: "/profile",
        element: <Profile></Profile>,
      },
      {
        path: "*",
        element: <Navigate to="/home" replace />,
      },
    ],
  },
  //====================================== Authentication
  {
    path: "/auth/login",
    element: <Login></Login>,
  },
  {
    path: "/auth/signin",
    element: <Signin></Signin>,
  },
]);
const queryClient = new QueryClient();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}></RouterProvider>
    </QueryClientProvider>
  </StrictMode>,
);
