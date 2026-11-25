import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, Save, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { requestApi, requestApiData, type IndividualRecord } from "../../lib/projectApi";

function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Impossible de lire cette image."));
    reader.readAsDataURL(file);
  });
}

export default function IndividuForm() {
  const { id_individue: individualId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(individualId);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!individualId) {
      return;
    }
    const id = individualId;
    const controller = new AbortController();

    async function loadIndividual() {
      setIsLoading(true);
      setError("");
      try {
        const individual = await requestApiData<IndividualRecord>(
          `/api?resource=individuals&id_individue=${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );
        setName(individual.nom);
        setPhoto(individual.photo_profil);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger cette personne.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadIndividual();
    return () => controller.abort();
  }, [individualId]);

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 2_000_000) {
      setError("Choisissez une image de moins de 2 Mo.");
      return;
    }
    try {
      setError("");
      setPhoto(await readImageAsBase64(file));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Image illisible.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Saisissez le nom de la personne.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const body = JSON.stringify({ nom: trimmedName, photo_profil: photo });
      const url = individualId
        ? `/api?resource=individuals&id_individue=${encodeURIComponent(individualId)}`
        : "/api?resource=individuals";
      await requestApi(url, {
        method: individualId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      navigate("/individu", {
        replace: true,
        state: {
          successMessage: isEditing
            ? "Personne modifiée avec succès."
            : "Personne ajoutée avec succès.",
        },
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible d’enregistrer cette personne.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <header>
        <Link
          to="/individu"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour au personnel
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
          Gestion du personnel
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {isEditing ? "Modifier la personne" : "Ajouter une personne"}
        </h1>
        <p className="mt-2 text-foreground/70">
          Cette personne pourra être affectée à des projets et à des tâches.
        </p>
      </header>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="rounded-2xl border border-secondary bg-light p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3 border-b border-secondary pb-5">
          <span className="rounded-lg bg-primary/10 p-3 text-primary">
            <UserRound aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-semibold">{isEditing ? "Informations" : "Nouvelle personne"}</h2>
            <p className="mt-1 text-sm text-foreground/70">La photo est facultative.</p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-xl border border-error/30 bg-base p-4 text-sm text-error">
            {error}
          </p>
        )}

        {isLoading ? (
          <p role="status" className="py-6 text-sm text-foreground/70">
            Chargement…
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="font-medium">Nom</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={50}
                autoFocus
                placeholder="Ex. Marie Razafindrakoto"
                className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-medium">Photo de profil (facultatif)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => void handlePhoto(event)}
                className="rounded-lg border border-secondary bg-base px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
              />
              <span className="text-xs text-foreground/60">Taille maximale : 2 Mo.</span>
            </label>

            {photo && (
              <div className="flex items-center gap-4 rounded-xl border border-secondary bg-base p-4">
                <img
                  src={`data:image/*;base64,${photo}`}
                  alt="Aperçu de la photo de profil"
                  className="h-16 w-16 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="text-sm font-semibold text-error hover:underline"
                >
                  Supprimer la photo
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-secondary pt-5 sm:flex-row">
          <Link
            to="/individu"
            className="inline-flex items-center justify-center rounded-lg border border-secondary px-5 py-2.5 font-semibold text-foreground transition hover:bg-base"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-light transition hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {isSubmitting ? "Enregistrement…" : isEditing ? "Enregistrer les modifications" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
