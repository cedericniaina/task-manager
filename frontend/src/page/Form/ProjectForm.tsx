import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, FolderKanban, Save, UsersRound, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import {
  requestApiData,
  saveProject,
  toDateInput,
  type AuthStatus,
  type DurationRecord,
  type IndividualRecord,
  type MemberRecord,
  type ProjectRecord,
  type StatusRecord,
} from "../../lib/projectApi";

export default function ProjectForm() {
  const { id_projet: projectId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(projectId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState("");
  const [limite, setLimite] = useState("");
  const [groupMode, setGroupMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<StatusRecord[]>([]);
  const [individuals, setIndividuals] = useState<IndividualRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadForm() {
      setIsLoading(true);
      setError("");
      try {
        const [statusData, individualData, authData] = await Promise.all([
          requestApiData<StatusRecord[]>("/api?resource=statuses", { signal: controller.signal }),
          requestApiData<IndividualRecord[]>("/api?resource=individuals", { signal: controller.signal }),
          requestApiData<AuthStatus>("/api?auth=status", { signal: controller.signal }),
        ]);
        setStatuses(statusData);
        setIndividuals(individualData);
        setCurrentUserId(authData.user?.id_utilisateur ?? null);

        const defaultStatus =
          statusData.find((status) => status.code === "todo") ?? statusData[0];

        if (projectId) {
          const [project, members, durations] = await Promise.all([
            requestApiData<ProjectRecord>(
              `/api?resource=projects&id_projet=${encodeURIComponent(projectId)}`,
              { signal: controller.signal },
            ),
            requestApiData<MemberRecord[]>("/api?resource=members", { signal: controller.signal }),
            requestApiData<DurationRecord[]>("/api?resource=durations", { signal: controller.signal }),
          ]);
          setName(project.nom);
          setDescription(project.description ?? "");
          setStatusId(String(project.id_status));
          const projectDuration = durations.find(
            (duration) => String(duration.id_durre) === String(project.id_durre),
          );
          setLimite(toDateInput(projectDuration?.limite));
          const ownerIndividual = individualData.find(
            (individual) => String(individual.id_utilisateur) === String(project.id_utilisateur),
          );
          const projectMembers = members
            .filter((member) => String(member.id_projet) === String(project.id_projet))
            .map((member) => String(member.id_individue))
            .filter((id) => id !== String(ownerIndividual?.id_individue ?? ""));
          setGroupMode(projectMembers.length > 0);
          setSelectedMembers(projectMembers);
        } else if (defaultStatus) {
          setStatusId(String(defaultStatus.id_status));
        }
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger le formulaire du projet.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadForm();
    return () => controller.abort();
  }, [projectId]);

  const availableMembers = individuals.filter(
    (individual) =>
      currentUserId === null ||
      String(individual.id_utilisateur ?? "") !== String(currentUserId),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Saisissez le nom du projet.");
      return;
    }
    if (!statusId) {
      setError("Sélectionnez un statut pour le projet.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await saveProject({
        ...(projectId ? { id_projet: Number(projectId) } : {}),
        nom: trimmedName,
        description: description.trim() || null,
        id_status: Number(statusId),
        limite: limite || null,
        membres: groupMode ? selectedMembers.map(Number) : [],
      });
      navigate("/project", {
        replace: true,
        state: {
          successMessage: isEditing
            ? "Projet modifié avec succès."
            : "Projet créé avec succès.",
        },
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible d’enregistrer le projet.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <header>
        <Link
          to="/project"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour aux projets
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
          Gestion des projets
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {isEditing ? "Modifier le projet" : "Créer un projet"}
        </h1>
        <p className="mt-2 text-foreground/70">
          Définissez le statut, l’échéance et le mode de travail (solo ou équipe).
        </p>
      </header>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="rounded-2xl border border-secondary bg-light p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3 border-b border-secondary pb-5">
          <span className="rounded-lg bg-primary/10 p-3 text-primary">
            <FolderKanban aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-semibold">
              {isEditing ? "Informations du projet" : "Nouveau projet"}
            </h2>
            <p className="mt-1 text-sm text-foreground/70">
              Le statut peut être modifié à tout moment depuis la liste des projets.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-xl border border-error/30 bg-base p-4 text-sm text-error">
            {error}
          </p>
        )}

        {isLoading ? (
          <p role="status" className="py-6 text-sm text-foreground/70">
            Chargement du formulaire…
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="font-medium">Nom du projet</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                autoFocus
                placeholder="Ex. Refonte du site web"
                className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-medium">Description (facultatif)</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Objectifs, contexte, livrables…"
                className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="font-medium">Statut</span>
                <select
                  value={statusId}
                  onChange={(event) => setStatusId(event.target.value)}
                  required
                  disabled={statuses.length === 0}
                  className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="" disabled>
                    {statuses.length === 0 ? "Aucun statut disponible" : "Choisir un statut"}
                  </option>
                  {statuses.map((status) => (
                    <option key={status.id_status} value={String(status.id_status)}>
                      {status.status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-medium">Date limite (facultatif)</span>
                <input
                  type="date"
                  value={limite}
                  onChange={(event) => setLimite(event.target.value)}
                  className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
                />
              </label>
            </div>

            <fieldset className="rounded-xl border border-secondary bg-base p-4">
              <legend className="px-1 font-medium">Mode de travail</legend>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-secondary bg-light p-3">
                  <input
                    type="radio"
                    name="work-mode"
                    checked={!groupMode}
                    onChange={() => setGroupMode(false)}
                    className="accent-primary"
                  />
                  <UserRound aria-hidden="true" className="h-5 w-5 text-primary" />
                  <span>
                    <span className="block font-semibold">Solo</span>
                    <span className="text-xs text-foreground/70">Vous travaillez seul</span>
                  </span>
                </label>
                <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-secondary bg-light p-3">
                  <input
                    type="radio"
                    name="work-mode"
                    checked={groupMode}
                    onChange={() => setGroupMode(true)}
                    className="accent-primary"
                  />
                  <UsersRound aria-hidden="true" className="h-5 w-5 text-primary" />
                  <span>
                    <span className="block font-semibold">Groupe</span>
                    <span className="text-xs text-foreground/70">Inviter des membres</span>
                  </span>
                </label>
              </div>

              {groupMode && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {availableMembers.length === 0 ? (
                    <p className="text-sm text-foreground/70">
                      Aucune autre personne n’est disponible. Créez d’abord une personne depuis
                      la page « Personnel ».
                    </p>
                  ) : (
                    availableMembers.map((individual) => {
                      const checked = selectedMembers.includes(String(individual.id_individue));
                      return (
                        <label
                          key={individual.id_individue}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-secondary bg-light px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedMembers((current) =>
                                checked
                                  ? current.filter((id) => id !== String(individual.id_individue))
                                  : [...current, String(individual.id_individue)],
                              )
                            }
                            className="accent-primary"
                          />
                          {individual.nom}
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </fieldset>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-secondary pt-5 sm:flex-row">
          <Link
            to="/project"
            className="inline-flex items-center justify-center rounded-lg border border-secondary px-5 py-2.5 font-semibold text-foreground transition hover:bg-base"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isLoading || isSubmitting || statuses.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-light transition hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {isSubmitting ? "Enregistrement…" : isEditing ? "Enregistrer les modifications" : "Créer le projet"}
          </button>
        </div>
      </form>
    </div>
  );
}
