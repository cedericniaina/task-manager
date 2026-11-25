import { useEffect, useMemo, useState } from "react";
import {
  CirclePlus,
  FolderKanban,
  ListTodo,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  deleteResource,
  importanceBadgeClass,
  patchResource,
  requestApiData,
  statusBadgeClass,
  type AssignmentRecord,
  type IndividualRecord,
  type Importance,
  type ProjectRecord,
  type StatusRecord,
  type TaskRecord,
} from "../lib/projectApi";
import Kanban from "../components/ui/Kanban";

type SortOrder = "task" | "project";
type ViewMode = "list" | "kanban";

export default function Tache() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [statuses, setStatuses] = useState<StatusRecord[]>([]);
  const [individuals, setIndividuals] = useState<IndividualRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("task");
  const [view, setView] = useState<ViewMode>("list");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
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

    async function loadTasks() {
      setIsLoading(true);
      setError("");
      try {
        const [taskData, projectData, statusData, individualData, assignmentData] =
          await Promise.all([
            requestApiData<TaskRecord[]>("/api?resource=tasks", { signal: controller.signal }),
            requestApiData<ProjectRecord[]>("/api?resource=projects", { signal: controller.signal }),
            requestApiData<StatusRecord[]>("/api?resource=statuses", { signal: controller.signal }),
            requestApiData<IndividualRecord[]>("/api?resource=individuals", { signal: controller.signal }),
            requestApiData<AssignmentRecord[]>("/api?resource=functions", { signal: controller.signal }),
          ]);
        setTasks(taskData);
        setProjects(projectData);
        setStatuses(statusData);
        setIndividuals(individualData);
        setAssignments(assignmentData);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error ? caughtError.message : "Impossible de charger les tâches.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();
    return () => controller.abort();
  }, [reloadKey]);

  const projectById = useMemo(
    () => new Map(projects.map((project) => [String(project.id_projet), project])),
    [projects],
  );
  const statusById = useMemo(
    () => new Map(statuses.map((status) => [String(status.id_status), status])),
    [statuses],
  );
  const individualById = useMemo(
    () => new Map(individuals.map((individual) => [String(individual.id_individue), individual])),
    [individuals],
  );
  const assigneesByTask = useMemo(() => {
    const grouped = new Map<string, AssignmentRecord[]>();
    for (const assignment of assignments) {
      const key = String(assignment.id_tache);
      grouped.set(key, [...(grouped.get(key) ?? []), assignment]);
    }
    return grouped;
  }, [assignments]);

  const visibleTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    return tasks
      .filter((task) => {
        const matchesSearch = task.nom.toLocaleLowerCase("fr").includes(normalizedSearch);
        const matchesProject =
          projectFilter === "all" || String(task.id_projet) === projectFilter;
        const matchesStatus =
          statusFilter === "all" || String(task.id_status) === statusFilter;
        return matchesSearch && matchesProject && matchesStatus;
      })
      .sort((first, second) => {
        const firstProject = projectById.get(String(first.id_projet))?.nom ?? "";
        const secondProject = projectById.get(String(second.id_projet))?.nom ?? "";
        return sortOrder === "task"
          ? first.nom.localeCompare(second.nom, "fr")
          : firstProject.localeCompare(secondProject, "fr") ||
              first.nom.localeCompare(second.nom, "fr");
      });
  }, [projectById, projectFilter, search, sortOrder, statusFilter, tasks]);

  async function changeStatus(task: TaskRecord, newStatusId: string) {
    setError("");
    try {
      await patchResource("tasks", "id_tache", task.id_tache, {
        id_status: Number(newStatusId),
      });
      setTasks((current) =>
        current.map((item) =>
          String(item.id_tache) === String(task.id_tache)
            ? { ...item, id_status: Number(newStatusId) }
            : item,
        ),
      );
      setNotice(`Statut de « ${task.nom} » mis à jour.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Impossible de changer le statut.",
      );
    }
  }

  async function deleteTask(task: TaskRecord) {
    if (!window.confirm(`Supprimer la tâche « ${task.nom} » et ses affectations ?`)) {
      return;
    }
    const taskId = String(task.id_tache);
    setDeletingTaskId(taskId);
    setError("");
    setNotice("");
    try {
      await deleteResource("tasks", "id_tache", taskId);
      setTasks((current) => current.filter((item) => String(item.id_tache) !== taskId));
      setNotice(`La tâche « ${task.nom} » a été supprimée.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Impossible de supprimer cette tâche.",
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  function renderTaskCard(task: TaskRecord) {
    const taskId = String(task.id_tache);
    const project = projectById.get(String(task.id_projet));
    const status = statusById.get(String(task.id_status));
    const assignees = assigneesByTask.get(taskId) ?? [];

    return (
      <article
        key={task.id_tache}
        className="flex min-h-56 flex-col rounded-xl border border-secondary bg-light p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold" title={task.nom}>
              {task.nom}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-foreground/70">
              <FolderKanban aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{project?.nom ?? "Projet introuvable"}</span>
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-base p-2 text-primary">
            <ListTodo aria-hidden="true" className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status?.code)}`}>
            {status?.status ?? "Sans statut"}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${importanceBadgeClass(task.importance as Importance)}`}>
            {task.importance}
          </span>
        </div>

        {task.description && (
          <p className="mt-3 line-clamp-2 text-sm text-foreground/70">{task.description}</p>
        )}

        {assignees.length > 0 && (
          <p className="mt-3 flex items-start gap-2 text-xs text-foreground/70">
            <UsersRound aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              {assignees
                .map((assignment) => individualById.get(String(assignment.id_individue))?.nom ?? "?")
                .join(", ")}
            </span>
          </p>
        )}

        <label className="mt-auto flex items-center gap-2 pt-4 text-xs font-medium text-foreground/70">
          Statut
          <select
            value={String(task.id_status)}
            onChange={(event) => void changeStatus(task, event.target.value)}
            className="flex-1 rounded-md border border-secondary bg-base px-2 py-1.5 text-xs outline-none focus:border-primary"
          >
            {statuses.map((option) => (
              <option key={option.id_status} value={String(option.id_status)}>
                {option.status}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-secondary pt-3">
          <Link
            to={`/tache/${encodeURIComponent(taskId)}/edit`}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-base focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Modifier
          </Link>
          <button
            type="button"
            onClick={() => void deleteTask(task)}
            disabled={deletingTaskId === taskId}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-error transition hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            {deletingTaskId === taskId ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Organisation du travail
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Mes tâches</h1>
          <p className="mt-2 text-foreground/70">
            Suivez l’avancement de chaque tâche et son affectation.
          </p>
        </div>
        <Link
          to="/tache/form"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-light transition-colors hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <CirclePlus aria-hidden="true" className="h-5 w-5" />
          Nouvelle tâche
        </Link>
      </header>

      <section aria-label="Résumé des tâches" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Tâches", value: tasks.length, icon: ListTodo },
          { label: "Projets disponibles", value: projects.length, icon: FolderKanban },
          {
            label: "Tâches terminées",
            value: tasks.filter(
              (task) => statusById.get(String(task.id_status))?.code === "done",
            ).length,
            icon: UsersRound,
          },
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="flex items-center gap-4 rounded-xl border border-secondary bg-light p-5">
            <span className="rounded-lg bg-primary/10 p-3 text-primary">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-foreground/70">{label}</p>
              <p className="text-2xl font-bold">{isLoading || error ? "—" : value}</p>
            </div>
          </article>
        ))}
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
                navigate("/tache", { replace: true, state: null });
              }
            }}
            className="shrink-0 font-semibold text-primary hover:underline"
          >
            Fermer
          </button>
        </p>
      )}

      <section aria-label="Liste des tâches">
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-secondary bg-light p-4 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Rechercher une tâche</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une tâche…"
              className="w-full rounded-lg border border-secondary bg-base py-2.5 pl-10 pr-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="min-w-0 lg:w-48">
            <span className="sr-only">Filtrer par projet</span>
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="w-full rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-accent"
            >
              <option value="all">Tous les projets</option>
              {projects.map((project) => (
                <option key={project.id_projet} value={String(project.id_projet)}>
                  {project.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 lg:w-48">
            <span className="sr-only">Filtrer par statut</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-accent"
            >
              <option value="all">Tous les statuts</option>
              {statuses.map((status) => (
                <option key={status.id_status} value={String(status.id_status)}>
                  {status.status}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 lg:w-48">
            <span className="sr-only">Trier les tâches</span>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value === "project" ? "project" : "task")
              }
              className="w-full rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-accent"
            >
              <option value="task">Trier par tâche</option>
              <option value="project">Trier par projet</option>
            </select>
          </label>
          <div
            role="group"
            aria-label="Mode d’affichage"
            className="inline-flex shrink-0 rounded-lg border border-secondary bg-base p-1"
          >
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${view === "list" ? "bg-primary text-light" : "text-foreground/70 hover:bg-light"}`}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setView("kanban")}
              aria-pressed={view === "kanban"}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${view === "kanban" ? "bg-primary text-light" : "text-foreground/70 hover:bg-light"}`}
            >
              Kanban
            </button>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={isLoading}
            aria-label="Actualiser les tâches"
            title="Actualiser"
            className="inline-flex items-center justify-center rounded-lg border border-secondary px-3 py-2 text-primary transition hover:bg-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoading ? (
          <p role="status" className="py-10 text-center text-sm text-foreground/70">
            Chargement des tâches…
          </p>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-secondary bg-light px-6 py-10 text-center">
            <p className="text-sm text-foreground/70">
              Les tâches ne peuvent pas être affichées pour le moment.
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 rounded-lg bg-primary px-4 py-2.5 font-semibold text-light hover:bg-foreground"
            >
              Réessayer
            </button>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-secondary bg-light px-6 py-12 text-center">
            <ListTodo aria-hidden="true" className="mx-auto h-10 w-10 text-primary/70" />
            <h2 className="mt-4 text-lg font-semibold">
              {tasks.length === 0 ? "Aucune tâche pour le moment" : "Aucun résultat"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
              {tasks.length === 0
                ? "Créez une tâche et associez-la à l’un de vos projets."
                : "Modifiez votre recherche ou vos filtres pour retrouver une tâche."}
            </p>
            {tasks.length === 0 && projects.length > 0 && (
              <Link
                to="/tache/form"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-light hover:bg-foreground"
              >
                <CirclePlus aria-hidden="true" className="h-4 w-4" />
                Créer une tâche
              </Link>
            )}
            {tasks.length === 0 && projects.length === 0 && (
              <Link
                to="/project/form"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-light hover:bg-foreground"
              >
                Créer d’abord un projet
              </Link>
            )}
          </div>
        ) : view === "kanban" && statuses.length > 0 ? (
          <Kanban
            columns={statuses.map((status) => ({
              id: String(status.id_status),
              title: status.status,
              badgeClassName: statusBadgeClass(status.code),
              items: visibleTasks
                .filter((task) => String(task.id_status) === String(status.id_status))
                .map(renderTaskCard),
            }))}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTasks.map(renderTaskCard)}
          </div>
        )}
      </section>
    </div>
  );
}
