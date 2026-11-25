import { useEffect, useMemo, useState } from "react";
import { CirclePlus, Pencil, RefreshCw, Search, Trash2, UserRound, UsersRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { deleteResource, requestApiData, type IndividualRecord } from "../lib/projectApi";

export default function Individu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [individuals, setIndividuals] = useState<IndividualRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const routeNotice =
    typeof location.state === "object" &&
    location.state !== null &&
    "successMessage" in location.state &&
    typeof location.state.successMessage === "string"
      ? location.state.successMessage
      : "";

  useEffect(() => {
    const controller = new AbortController();

    async function loadIndividuals() {
      setIsLoading(true);
      setError("");
      try {
        const data = await requestApiData<IndividualRecord[]>("/api?resource=individuals", {
          signal: controller.signal,
        });
        setIndividuals(data);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger le personnel.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadIndividuals();
    return () => controller.abort();
  }, [reloadKey]);

  const visibleIndividuals = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("fr");
    return individuals
      .filter((individual) => individual.nom.toLocaleLowerCase("fr").includes(normalized))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [individuals, search]);

  async function deleteIndividual(individual: IndividualRecord) {
    if (!window.confirm(`Supprimer « ${individual.nom} » de l’équipe ?`)) {
      return;
    }
    const id = String(individual.id_individue);
    setDeletingId(id);
    setError("");
    setNotice("");
    try {
      await deleteResource("individuals", "id_individue", id);
      setIndividuals((current) =>
        current.filter((item) => String(item.id_individue) !== id),
      );
      setNotice(`« ${individual.nom} » a été supprimé.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de supprimer cette personne.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Collaboration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Personnel</h1>
          <p className="mt-2 text-foreground/70">
            Ajoutez les personnes qui peuvent participer à vos projets et tâches.
          </p>
        </div>
        <Link
          to="/individu/form"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-light transition-colors hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <CirclePlus aria-hidden="true" className="h-5 w-5" />
          Nouvelle personne
        </Link>
      </header>

      <section aria-label="Résumé du personnel" className="flex items-center gap-4 rounded-xl border border-secondary bg-light p-5">
        <span className="rounded-lg bg-primary/10 p-3 text-primary">
          <UsersRound aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-foreground/70">Personnes enregistrées</p>
          <p className="text-2xl font-bold">{isLoading || error ? "—" : individuals.length}</p>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-error/30 bg-light p-4 text-sm text-error">
          {error}
        </p>
      )}
      {(notice || routeNotice) && (
        <p role="status" className="flex items-center justify-between gap-4 rounded-xl border border-success/30 bg-light p-4 text-sm text-foreground">
          <span>{notice || routeNotice}</span>
          <button
            type="button"
            onClick={() => {
              setNotice("");
              if (routeNotice) {
                navigate("/individu", { replace: true, state: null });
              }
            }}
            className="shrink-0 font-semibold text-primary hover:underline"
          >
            Fermer
          </button>
        </p>
      )}

      <section aria-label="Liste du personnel">
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-secondary bg-light p-4 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Rechercher une personne</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une personne…"
              className="w-full rounded-lg border border-secondary bg-base py-2.5 pl-10 pr-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
            />
          </label>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={isLoading}
            aria-label="Actualiser le personnel"
            className="inline-flex items-center justify-center rounded-lg border border-secondary px-3 py-2 text-primary transition hover:bg-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoading ? (
          <p role="status" className="py-10 text-center text-sm text-foreground/70">
            Chargement du personnel…
          </p>
        ) : error ? (
          <p className="rounded-2xl border border-dashed border-secondary bg-light px-6 py-10 text-center text-sm text-foreground/70">
            Impossible d’afficher le personnel pour le moment.
          </p>
        ) : visibleIndividuals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-secondary bg-light px-6 py-12 text-center">
            <UsersRound aria-hidden="true" className="mx-auto h-10 w-10 text-primary/70" />
            <h2 className="mt-4 text-lg font-semibold">
              {individuals.length === 0 ? "Aucune personne pour le moment" : "Aucun résultat"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
              {individuals.length === 0
                ? "Ajoutez une personne pour pouvoir former une équipe sur un projet."
                : "Modifiez votre recherche."}
            </p>
            {individuals.length === 0 && (
              <Link
                to="/individu/form"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-light hover:bg-foreground"
              >
                <CirclePlus aria-hidden="true" className="h-4 w-4" />
                Ajouter une personne
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleIndividuals.map((individual) => (
              <article
                key={individual.id_individue}
                className="flex min-h-40 flex-col rounded-xl border border-secondary bg-light p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {individual.photo_profil ? (
                    <img
                      src={`data:image/*;base64,${individual.photo_profil}`}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound aria-hidden="true" className="h-6 w-6" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{individual.nom}</h2>
                    <p className="mt-1 text-xs text-foreground/60">
                      {individual.id_utilisateur === null ? "Membre externe" : "Compte utilisateur lié"}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-end gap-2 border-t border-secondary pt-4">
                  <Link
                    to={`/individu/${encodeURIComponent(String(individual.id_individue))}/edit`}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-base"
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => void deleteIndividual(individual)}
                    disabled={deletingId === String(individual.id_individue)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-error transition hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {deletingId === String(individual.id_individue) ? "Suppression…" : "Supprimer"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
