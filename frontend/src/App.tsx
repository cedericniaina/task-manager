import { useEffect, useState } from "react";
import "./index.css";
import { Navigate, Outlet, useLocation } from "react-router";
import Sidebar from "./components/Sidebar";
import { requestApiData, type AuthStatus } from "./lib/projectApi";

function App() {
  const location = useLocation();
  const [authState, setAuthState] = useState<
    "checking" | "authenticated" | "unauthenticated" | "unavailable"
  >("checking");
  const [authError, setAuthError] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function checkAuthentication() {
      setAuthState("checking");
      setAuthError("");
      try {
        const status = await requestApiData<AuthStatus>(
          "/api?auth=status",
          { signal: controller.signal },
        );
        setSetupRequired(status.setupRequired);
        setAuthState(status.authenticated ? "authenticated" : "unauthenticated");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setAuthError(
          error instanceof Error ? error.message : "Impossible de vérifier la connexion.",
        );
        setAuthState("unavailable");
      }
    }

    void checkAuthentication();
    return () => controller.abort();
  }, [retryKey]);

  if (authState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base px-5 text-foreground">
        <p role="status">Vérification de la connexion…</p>
      </main>
    );
  }

  if (authState === "unauthenticated") {
    const requestedPage =
      location.pathname === "/"
        ? "/home"
        : `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={setupRequired ? "/auth/signin" : "/auth/login"}
        replace
        state={{ from: requestedPage }}
      />
    );
  }

  if (authState === "unavailable") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base px-5 text-center text-foreground">
        <p role="alert" className="max-w-lg rounded-xl border border-error/30 bg-light p-4 text-sm text-error">
          {authError}
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((key) => key + 1)}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-light hover:bg-foreground"
        >
          Réessayer
        </button>
      </main>
    );
  }

  return (
    <div className="w-screen flex gap-2 sm:flex-row flex-col overflow-hidden ">
      <aside className="sm:min-w-65 sm:max-w-65 sm:h-screen h-fit w-screen overflow-hidden">
        <Sidebar></Sidebar>
      </aside>
      <main className=" w-full overflow-scroll h-screen px-2">
        <Outlet></Outlet>
      </main>
    </div>
  );
}

export default App;
