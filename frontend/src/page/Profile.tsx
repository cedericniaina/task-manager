import { useEffect, useState } from "react";
import { Clock3, LogIn, LogOut, UserPlus, UserRound } from "lucide-react";

interface ProfileData {
  id_utilisateur: number;
  nom: string;
  email: string;
}

interface HistoryItem {
  action: "account_created" | "login" | "logout";
  date_action: string;
}

interface ApiResponse<T> {
  data: T;
}

const historyLabels: Record<HistoryItem["action"], string> = {
  account_created: "Compte créé",
  login: "Connexion à votre compte",
  logout: "Déconnexion",
};

const historyIcons = {
  account_created: UserPlus,
  login: LogIn,
  logout: LogOut,
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const [statusResponse, historyResponse] = await Promise.all([
          fetch("/api?auth=status", {
            credentials: "include",
            signal: controller.signal,
          }),
          fetch("/api?auth=history", {
            credentials: "include",
            signal: controller.signal,
          }),
        ]);

        const statusResult =
          (await statusResponse.json()) as ApiResponse<{
            authenticated: boolean;
            user: ProfileData | null;
          }> & { error?: string };
        const historyResult =
          (await historyResponse.json()) as ApiResponse<HistoryItem[]> & {
            error?: string;
          };

        if (!statusResponse.ok || !statusResult.data?.user) {
          throw new Error(statusResult.error ?? "Impossible de charger le profil.");
        }
        if (!historyResponse.ok) {
          throw new Error(historyResult.error ?? "Impossible de charger l’historique.");
        }

        setProfile(statusResult.data.user);
        setHistory(historyResult.data);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Une erreur est survenue pendant le chargement du profil.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Espace personnel
        </p>
        <h1 className="mt-2 text-3xl font-bold">Mon profil</h1>
      </header>

      {isLoading ? (
        <p role="status" className="text-sm text-foreground/70">
          Chargement du profil…
        </p>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-error/30 bg-light p-4 text-sm text-error">
          {error}
        </p>
      ) : (
        <>
          <section className="flex items-center gap-4 rounded-2xl border border-secondary bg-light p-6 shadow-sm">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound aria-hidden="true" className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">{profile?.nom}</h2>
              <p className="mt-1 truncate text-sm text-foreground/70">{profile?.email}</p>
            </div>
          </section>

          <section aria-labelledby="profile-history-title">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 id="profile-history-title" className="text-xl font-bold">
                Historique récent
              </h2>
            </div>

            {history.length === 0 ? (
              <p className="rounded-xl border border-secondary bg-light p-5 text-sm text-foreground/70">
                Aucune activité enregistrée pour le moment.
              </p>
            ) : (
              <ol className="divide-y divide-secondary rounded-xl border border-secondary bg-light px-5">
                {history.map((item, index) => {
                  const Icon = historyIcons[item.action];
                  const date = new Date(item.date_action);
                  const formattedDate = Number.isNaN(date.getTime())
                    ? item.date_action
                    : new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(date);

                  return (
                    <li key={`${item.action}-${item.date_action}-${index}`} className="flex gap-4 py-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base text-primary">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium">{historyLabels[item.action]}</p>
                        <time
                          className="mt-1 block text-sm text-foreground/60"
                          dateTime={
                            Number.isNaN(date.getTime()) ? undefined : date.toISOString()
                          }
                        >
                          {formattedDate}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
