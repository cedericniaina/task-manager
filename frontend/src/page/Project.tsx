import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  CalendarDays,
  CirclePlus,
  FolderKanban,
  ListChecks,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  deleteResource,
  formatDate,
  patchResource,
  requestApiData,
  statusBadgeClass,
  type DurationRecord,
  type IndividualRecord,
  type MemberRecord,
  type ProjectRecord,
  type ProjectTask,
  type StatusRecord,
} from "../lib/projectApi";

type SortOrder = "name" | "deadline";

export default function Project() {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [statuses, setStatuses] = useState<StatusRecord[]>([]);
  const [durations, setDurations] = useState<DurationRecord[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [individuals, setIndividuals] = useState<IndividualRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("name");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
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

    async function loadProjects() {
      setIsLoading(true);
      setError("");
      try {
        const [projectData, statusData, durationData, taskData, memberData, individualData] =
          await Promise.all([
            requestApiData<ProjectRecord[]>("/api?resource=projects", { signal: controller.signal }),
            requestApiData<StatusRecord[]>("/api?resource=statuses", { signal: controller.signal }),
            requestApiData<DurationRecord[]>("/api?resource=durations", { signal: controller.signal }),
            requestApiData<ProjectTask[]>("/api?resource=tasks", { signal: controller.signal }),
            requestApiData<MemberRecord[]>("/api?resource=members", { signal: controller.signal }),
            requestApiData<IndividualRecord[]>("/api?resource=individuals", { signal: controller.signal }),
          ]);
        setProjects(projectData);
        setStatuses(statusData);
        setDurations(durationData);
        setTasks(taskData);
        setMembers(memberData);
        setIndividuals(individualData);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error ? caughtError.message : "Impossible de charger les projets.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();
    return () => controller.abort();
  }, [reloadKey]);

  const statusById = useMemo(
    () => new Map(statuses.map((status) => [String(status.id_status), status])),
    [statuses],
  );
  const durationById = useMemo(
    () => new Map(durations.map((duration) => [String(duration.id_durre), duration])),
    [durations],
  );
  const individualById = useMemo(
    () => new Map(individuals.map((individual) => [String(individual.id_individue), individual])),
    [individuals],
  );
  const membersByProject = useMemo(() => {
    const grouped = new Map<string, MemberRecord[]>();
    for (const member of members) {
      const key = String(member.id_projet);
      grouped.set(key, [...(grouped.get(key) ?? []), member]);
    }
    return grouped;
  }, [members]);
  const taskCountByProject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      const key = String(task.id_projet);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const visibleProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    return projects
      .filter((project) => {
        const matchesSearch = project.nom.toLocaleLowerCase("fr").includes(normalizedSearch);
        const matchesStatus =
          statusFilter === "all" || String(project.id_status) === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        if (sortOrder === "name") {
          return first.nom.localeCompare(second.nom, "fr");
        }
        const firstDate = durationById.get(String(first.id_durre))?.limite;
        const secondDate = durationById.get(String(second.id_durre))?.limite;
        if (!firstDate) return secondDate ? 1 : first.nom.localeCompare(second.nom, "fr");
        if (!secondDate) return -1;
        return firstDate.localeCompare(secondDate);
      });
  }, [durationById, projects, search, sortOrder, statusFilter]);

  async function changeStatus(project: ProjectRecord, newStatusId: string) {
    setError("");
    try {
      await patchResource("projects", "id_projet", project.id_projet, {
        id_status: Number(newStatusId),
      });
      setProjects((current) =>
        current.map((item) =>
          String(item.id_projet) === String(project.id_projet)
            ? { ...item, id_status: Number(newStatusId) }
            : item,
        ),
      );
      setNotice(`Statut de « ${project.nom} » mis à jour.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Impossible de changer le statut.",
      );
    }
  }

  async function deleteProject(project: ProjectRecord) {
    if (!window.confirm(`Supprimer le projet « ${project.nom} », ses tâches et son équipe ?`)) {
      return;
    }
    const projectId = String(project.id_projet);
    setDeletingProjectId(projectId);
    setError("");
    setNotice("");
    try {
      await deleteResource("projects", "id_projet", projectId);
      setProjects((current) =>
        current.filter((item) => String(item.id_projet) !== projectId),
      );
      setNotice(`Le projet « ${project.nom} » a été supprimé.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Impossible de supprimer ce projet.",
      );
    } finally {
      setDeletingProjectId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Espace de travail
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Mes projets</h1>
          <p className="mt-2 text-foreground/70">
            Créez, organisez et suivez vos projets en solo ou en équipe.
          </p>
        </div>
        <Link
          to="/project/form"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-light transition-colors hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <CirclePlus aria-hidden="true" className="h-5 w-5" />
          Nouveau projet
        </Link>
      </header>

      <section aria-label="Résumé des projets" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Projets", value: projects.length, icon: FolderKanban },
          { label: "Tâches associées", value: tasks.length, icon: ListChecks },
          { label: "Statuts disponibles", value: statuses.length, icon: ArrowDownWideNarrow },
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
                navigate("/project", { replace: true, state: null });
              }
            }}
            className="shrink-0 font-semibold text-primary hover:underline"
          >
            Fermer
          </button>
        </p>
      )}

      <section aria-label="Liste des projets">
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-secondary bg-light p-4 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Rechercher un projet</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un projet…"
              className="w-full rounded-lg border border-secondary bg-base py-2.5 pl-10 pr-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="min-w-0 sm:w-52">
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
          <label className="min-w-0 sm:w-52">
            <span className="sr-only">Trier les projets</span>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value === "deadline" ? "deadline" : "name")
              }
              className="w-full rounded-lg border border-secondary bg-base px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-accent"
            >
              <option value="name">Trier par nom</option>
              <option value="deadline">Trier par échéance</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={isLoading}
            aria-label="Actualiser les projets"
            title="Actualiser"
            className="inline-flex items-center justify-center rounded-lg border border-secondary px-3 py-2 text-primary transition hover:bg-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoading ? (
          <p role="status" className="py-10 text-center text-sm text-foreground/70">
            Chargement des projets…
          </p>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-secondary bg-light px-6 py-10 text-center">
            <p className="text-sm text-foreground/70">
              Les projets ne peuvent pas être affichés pour le moment.
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 rounded-lg bg-primary px-4 py-2.5 font-semibold text-light hover:bg-foreground"
            >
              Réessayer
            </button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-secondary bg-light px-6 py-12 text-center">
            <FolderKanban aria-hidden="true" className="mx-auto h-10 w-10 text-primary/70" />
            <h2 className="mt-4 text-lg font-semibold">
              {projects.length === 0 ? "Aucun projet pour le moment" : "Aucun résultat"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
              {projects.length === 0
                ? "Créez votre premier projet pour commencer à organiser vos tâches."
                : "Modifiez votre recherche ou votre filtre pour retrouver un projet."}
            </p>
            {projects.length === 0 && (
              <Link
                to="/project/form"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-light hover:bg-foreground"
              >
                <CirclePlus aria-hidden="true" className="h-4 w-4" />
                Créer un projet
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => {
              const status = statusById.get(String(project.id_status));
              const duration = durationById.get(String(project.id_durre));
              const taskCount = taskCountByProject.get(String(project.id_projet)) ?? 0;
              const projectMembers = membersByProject.get(String(project.id_projet)) ?? [];
              const deadline = formatDate(duration?.limite);
              const startDate = formatDate(duration?.creation);

              return (
                <article
                  key={project.id_projet}
                  className="flex min-h-60 flex-col rounded-xl border border-secondary bg-light p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold" title={project.nom}>
                        {project.nom}
                      </h2>
                      <span
                        className={`mt-2 inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status?.code)}`}
                      >
                        <span className="truncate">{status?.status ?? "Sans statut"}</span>
                      </span>
                    </div>
                    <span className="shrink-0 rounded-lg bg-base p-2 text-primary">
                      <FolderKanban aria-hidden="true" className="h-5 w-5" />
                    </span>
                  </div>

                  {project.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-foreground/70">
                      {project.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-1 flex-col gap-3 text-sm text-foreground/70">
                    <p className="flex items-center gap-2">
                      <ListChecks aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                      {taskCount} tâche{taskCount === 1 ? "" : "s"}
                    </p>
                    <p className="flex items-center gap-2">
                      <UsersRound aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                      {projectMembers.length > 1
                        ? `Groupe · ${projectMembers.length} personnes`
                        : "Solo"}
                      {projectMembers.length > 1 && (
                        <span className="truncate text-xs">
                          ({projectMembers
                            .map((member) => individualById.get(String(member.id_individue))?.nom ?? "?")
                            .join(", ")})
                        </span>
                      )}
                    </p>
                    {(startDate || deadline) && (
                      <p className="flex items-start gap-2">
                        <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>
                          {startDate && <>Début : {startDate}</>}
                          {startDate && deadline && <br />}
                          {deadline && <>Échéance : {deadline}</>}
                        </span>
                      </p>
                    )}
                  </div>

                  <label className="mt-4 flex items-center gap-2 text-xs font-medium text-foreground/70">
                    Statut
                    <select
                      value={String(project.id_status)}
                      onChange={(event) => void changeStatus(project, event.target.value)}
                      className="flex-1 rounded-md border border-secondary bg-base px-2 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      {statuses.map((option) => (
                        <option key={option.id_status} value={String(option.id_status)}>
                          {option.status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-secondary pt-3">
                    <Link
                      to={`/project/${encodeURIComponent(String(project.id_projet))}/edit`}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-base focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                      Modifier
                    </Link>
                    <button
                      type="button"
                      onClick={() => void deleteProject(project)}
                      disabled={deletingProjectId === String(project.id_projet)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-error transition hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      {deletingProjectId === String(project.id_projet) ? "Suppression…" : "Supprimer"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
