import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import Title from "../../components/ui/Title";
import Button from "../../components/ui/Button";
import MotionColor from "../../components/ui/motion/MotionColors";
import { requestApiData, type AuthStatus } from "../../lib/projectApi";

interface FormFields {
  nom: string;
  email: string;
  password: string;
}
export default function Signin() {
  const { register, handleSubmit } = useForm<FormFields>();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function checkAccess() {
      try {
        const status = await requestApiData<AuthStatus>("/api?auth=status", {
          signal: controller.signal,
        });
        if (status.authenticated) {
          navigate("/home", { replace: true });
        } else if (!status.setupRequired) {
          navigate("/auth/login", { replace: true });
        }
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de vérifier l’accès à l’inscription.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsChecking(false);
        }
      }
    }

    void checkAccess();
    return () => controller.abort();
  }, [navigate]);

  const onSubmit: SubmitHandler<FormFields> = async ({ nom, email, password }) => {
    setError("");
    setIsSubmitting(true);
    try {
      await requestApiData<NonNullable<AuthStatus["user"]>>("/api?auth=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nom, email, password }),
      });
      navigate("/home", { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de contacter le serveur. Vérifiez que l’API est démarrée.",
      );
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
      <div className="relative z-10 flex w-full">
        {/* =================================== FORM */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="m-auto w-full max-w-md rounded-2xl border-t-4 border-primary bg-light p-6 shadow-xl shadow-shadow/20 sm:p-8"
        >
          {/* ================================== TITLE */}
          <div className="mb-6 border-b border-secondary pb-3 text-center">
            <Title text={"Inscription"} variant="4xl"></Title>
          </div>
          {/* ================================== FORM */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="nom">Nom :</label>
              <input
                type="text"
                autoComplete="name"
                maxLength={50}
                required
                {...register("nom")}
                className={inputStyle}
              />
            </div>
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
                autoComplete="new-password"
                minLength={10}
                maxLength={1024}
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
          {isChecking && (
            <p role="status" className="mt-4 text-sm text-foreground/70">
              Vérification de l’accès à l’inscription…
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              text={
                isChecking
                  ? "Vérification..."
                  : isSubmitting
                    ? "Création du compte..."
                    : "Créer mon compte"
              }
              variant="accent"
              disabled={isSubmitting || isChecking}
              className="font-semibold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            ></Button>
          </div>
        </form>
      </div>
    </div>
  );
}
