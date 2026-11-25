import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ListTodo, Save, UsersRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import {
  IMPORTANCE_OPTIONS,
  requestApiData,
  saveTask,
  type AssignmentRecord,
  type Importance,
  type IndividualRecord,
  type ProjectRecord,
  type StatusRecord,
  type TaskRecord,
} from "../../lib/projectApi";

export default function TacheForm() {
  const { id_tache: taskId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(taskId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [importance, setImportance] = useState<Importance>("Non importante");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [statuses, setStatuses] = useState<StatusRecord[]>([]);
  const [individuals, setIndividuals] = useState<IndividualRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadForm() {
      setIsLoading(true);
      setError("");
      try {
        const [projectData, statusData, individualData] = await Promise.all([
          requestApiData<ProjectRecord[]>("/api?resource=projects", { signal: controller.signal }),
          requestApiData<StatusRecord[]>("/api?resource=statuses", { signal: controller.signal }),
          requestApiData<IndividualRecord[]>("/api?resource=individuals", { signal: controller.signal }),
        ]);
        setProjects(projectData);
        setStatuses(statusData);
        setIndividuals(individualData);

        const defaultStatus =
          statusData.find((status) => status.code === "todo") ?? statusData[0];

        if (taskId) {
          const [task, assignments] = await Promise.all([
            requestApiData<TaskRecord>(
              `/api?resource=tasks&id_tache=${encodeURIComponent(taskId)}`,
              { signal: controller.signal },
            ),
            requestApiData<AssignmentRecord[]>("/api?resource=functions", { signal: controller.signal }),
          ]);
          setName(task.nom);
          setDescription(task.description ?? "");
          setProjectId(String(task.id_projet));
          setStatusId(String(task.id_status));
          setImportance(task.importance);
          setSelectedAssignees(
            assignments
              .filter((assignment) => String(assignment.id_tache) === String(task.id_tache))
              .map((assignment) => String(assignment.id_individue)),
          );
        } else if (projectData[0]) {
          setProjectId(String(projectData[0].id_projet));
          if (defaultStatus) {
            setStatusId(String(defaultStatus.id_status));
          }
        }
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger le formulaire de tâche.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadForm();
    return () => controller.abort();
  }, [taskId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Saisissez le nom de la tâche.");
      return;
    }
    if (!projectId) {
      setError("Sélectionnez un projet pour cette tâche.");
      return;
    }
    if (!statusId) {
      setError("Sélectionnez un statut pour cette tâche.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await saveTask({
        ...(taskId ? { id_tache: Number(taskId) } : {}),
        nom: trimmedName,
        description: description.trim() || null,
        id_projet: Number(projectId),
        id_status: Number(statusId),
        importance,
        assignes: selectedAssignees.map(Number),
      });
      navigate("/tache", {
        replace: true,
        state: {
          successMessage: isEditing
            ? "Tâche modifiée avec succès."
            : "Tâche créée avec succès.",
        },
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible d’enregistrer la tâche.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <header>
        <Link
          to="/tache"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour aux tâches
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
          Gestion des tâches
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {isEditing ? "Modifier la tâche" : "Créer une tâche"}
        </h1>
        <p className="mt-2 text-foreground/70">
          Chaque tâche appartient à un projet et possède son propre statut.
        </p>
      </header>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="rounded-2xl border border-secondary bg-light p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3 border-b border-secondary pb-5">
          <span className="rounded-lg bg-primary/10 p-3 text-primary">
            <ListTodo aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-semibold">
              {isEditing ? "Informations de la tâche" : "Nouvelle tâche"}
            </h2>
            <p className="mt-1 text-sm text-foreground/70">
              Affectez la tâche à une ou plusieurs personnes si besoin.
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
              <span className="font-medium">Nom de la tâche</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                autoFocus
                placeholder="Ex. Préparer le cahier des charges"
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
                placeholder="Détails, critères de validation…"
                className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="font-medium">Projet associé</span>
                <select
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  required
                  disabled={projects.length === 0}
                  className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="" disabled>
                    {projects.length === 0 ? "Aucun projet disponible" : "Choisir un projet"}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id_projet} value={String(project.id_projet)}>
                      {project.nom}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-medium">Statut</span>
                <select
                  value={statusId}
                  onChange={(event) => setStatusId(event.target.value)}
                  required
                  disabled={statuses.length === 0}
                  className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {statuses.map((status) => (
                    <option key={status.id_status} value={String(status.id_status)}>
                      {status.status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-medium">Importance</span>
              <select
                value={importance}
                onChange={(event) => setImportance(event.target.value as Importance)}
                className="rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
              >
                {IMPORTANCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="rounded-xl border border-secondary bg-base p-4">
              <legend className="flex items-center gap-2 px-1 font-medium">
                <UsersRound aria-hidden="true" className="h-4 w-4 text-primary" />
                Affectation
              </legend>
              {individuals.length === 0 ? (
                <p className="text-sm text-foreground/70">
                  Aucune personne enregistrée. Ajoutez une personne depuis la page « Personnel ».
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {individuals.map((individual) => {
                    const checked = selectedAssignees.includes(String(individual.id_individue));
                    return (
                      <label
                        key={individual.id_individue}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-secondary bg-light px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedAssignees((current) =>
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
                  })}
                </div>
              )}
            </fieldset>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-secondary pt-5 sm:flex-row">
          <Link
            to="/tache"
            className="inline-flex items-center justify-center rounded-lg border border-secondary px-5 py-2.5 font-semibold text-foreground transition hover:bg-base"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isLoading || isSubmitting || projects.length === 0 || statuses.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-light transition hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {isSubmitting
              ? "Enregistrement…"
              : isEditing
                ? "Enregistrer les modifications"
                : "Créer la tâche"}
          </button>
        </div>
      </form>
    </div>
  );
}
