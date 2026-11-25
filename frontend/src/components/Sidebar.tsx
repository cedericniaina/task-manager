/*
    Le sidebar
*/
import Title from "./ui/Title";
import { useState, type ReactElement } from "react";
import LinkButton from "./ui/LinkButton";
import { useNavigate } from "react-router";
import { requestApi } from "../lib/projectApi";

import {
  HomeIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  LogOutIcon,
  MenuIcon,
  PersonStandingIcon,
  User,
  WorkflowIcon,
  XIcon,
} from "lucide-react";
import Button from "./ui/Button";
import { motion } from "motion/react";
import LogoTaskManager from "./ui/icon/LogoTaskManager";
interface routes {
  path: string;
  text: string | ReactElement;
  action?: () => void;
}
export default function Sidebar() {
  const [hidden, setHidden] = useState<boolean>(true);
  const navigate = useNavigate();
  const styleIcon = "w-5 h-5 my-auto";
  const styleName = "";
  // ================================ LES ROUTER EN MILLEU
  const mainRoute: routes[] = [
    {
      path: "/home",
      text: (
        <p className="flex flex-row gap-2">
          <HomeIcon className={styleIcon}></HomeIcon>
          <span className={styleName}>Home</span>
        </p>
      ),
    },
    {
      path: "/dashboard",
      text: (
        <p className="flex flex-row gap-2">
          <LayoutDashboardIcon className={styleIcon}></LayoutDashboardIcon>
          <span className={styleName}>Tableau de bord</span>
        </p>
      ),
    },
    {
      path: "/project",
      text: (
        <p className="flex flex-row gap-2">
          <WorkflowIcon className={styleIcon}></WorkflowIcon>
          <span className={styleName}>Projets</span>
        </p>
      ),
    },
    {
      path: "/tache",
      text: (
        <p className="flex flex-row gap-2">
          <ListTodoIcon className={styleIcon}></ListTodoIcon>
          <span className={styleName}>Tâches</span>
        </p>
      ),
    },
    {
      path: "/individu",
      text: (
        <p className="flex flex-row gap-2">
          <PersonStandingIcon className={styleIcon}></PersonStandingIcon>
          <span className={styleName}>Personnel</span>
        </p>
      ),
    },
  ];
  // ================================ LES ROUTER EN BAS
  const bottomRoute = [
    {
      path: "/profile",
      text: (
        <p className="flex flex-row gap-2">
          <User className={styleIcon}></User>
          <span className={styleName}>Profile</span>
        </p>
      ),
    },
  ];

  async function logout() {
    try {
      await requestApi("/api?auth=logout", { method: "POST" });
    } catch {
      // On quitte l'interface même si la session côté serveur est déjà expirée.
    }
    navigate("/auth/login", { replace: true });
  }
  return (
    <div className="flex flex-col sm:w-65 sm:h-screen h-fit w-screen relative">
      <motion.div className={`sm:hidden bg-foreground flex justify-between`}>
        <Title
          text={
            <>
              <span className="text-primary">Task-</span>
              <span className="text-secondary">Manager</span>
            </>
          }
          className="bg-foreground"
        ></Title>
        <Button
          text={hidden ? <MenuIcon /> : <XIcon />}
          action={() => setHidden(!hidden)}
        ></Button>
      </motion.div>
      <motion.div
        className={`flex-col bg-foreground h-screen pl-2 sm:flex sm:relative sm:w-auto ${hidden ? "hidden" : "flex fixed h-[90%] w-3xs"}`}
      >
        <LogoTaskManager></LogoTaskManager>
        <div className="flex flex-col gap-2 h-full">
          {mainRoute.map((item) => (
            <div className="text-light" key={item.path}>
              <LinkButton
                to={item.path}
                text={item.text}
                action={() => setHidden(true)}
              />
            </div>
          ))}
        </div>
        <div className="py-2">
          {bottomRoute.map((item) => (
            <div className="text-light" key={item.path}>
              <LinkButton
                to={item.path}
                text={item.text}
                action={() => setHidden(true)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full flex-row gap-2 px-2 py-1 text-left text-light transition hover:text-primary"
          >
            <LogOutIcon className={styleIcon} />
            <span>Déconnecter</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
