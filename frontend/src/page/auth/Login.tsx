import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import Title from "../../components/ui/Title";
import Button from "../../components/ui/Button";
import MotionColor from "../../components/ui/motion/MotionColors";
import LogoTaskManager from "../../components/ui/icon/LogoTaskManager";
// import.meta.env.BACKEND_HOST

interface FormFields {
  email: string;
  password: string;
}
export default function Login() {
  const { register, handleSubmit } = useForm<FormFields>();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api?auth=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result: unknown = await response.json();
      const serverError =
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        typeof result.error === "string"
          ? result.error
          : "La connexion a échoué. Veuillez réessayer.";

      if (!response.ok) {
        setError(serverError);
        return;
      }

      navigate("/home", { replace: true });
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez que l’API est démarrée.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const inputStyle =
    "rounded-md border border-secondary bg-base px-3 py-2 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-accent";
  return (
    <div className="relative isolate flex min-h-screen w-screen items-center justify-center overflow-hidden bg-base px-4 py-8 text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <MotionColor></MotionColor>
      </div>
      <div className="relative z-10 w-full">
        <div className="flex flex-col">
          <LogoTaskManager className="m-auto text-foreground" variant="6xl"></LogoTaskManager>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="m-auto w-full max-w-md rounded-2xl border-t-4 border-primary bg-light p-6 shadow-xl shadow-shadow/20 sm:p-8"
          >
            {/* ================================== TITLE */}
            <div className="mb-6 border-b border-secondary pb-3 text-center">
              <Title text={"login"} variant="4xl"></Title>
            </div>
            {/* ================================== FORM */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email">Email :</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  {...register("email")}
                  className={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="password">Mot de passe :</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  {...register("password")}
                  className={inputStyle}
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-error">
                {error}
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                text={isSubmitting ? "Connexion..." : "Se connecter"}
                variant="accent"
                disabled={isSubmitting}
                className="font-semibold text-white transition-colors hover:bg-primary"
              ></Button>
            </div>
            <div className="mt-3 text-right text-sm">
              pas encore de compte ?{" "}
              <a className="font-semibold text-primary hover:underline" href="/auth/signin">
                inscrivez vous
              </a>
            </div>
          </form>
        </div>
        {/* =================================== FORM */}
      </div>
    </div>
  );
}
