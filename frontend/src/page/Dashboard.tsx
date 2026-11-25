import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  FolderKanban,
  ListChecks,
  ListTodo,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";
import {
  daysUntil,
  formatDate,
  numericId,
  requestApiData,
  statusBadgeClass,
  type DurationRecord,
  type MemberRecord,
  type ProjectRecord,
  type StatusRecord,
  type TaskRecord,
} from "../lib/projectApi";
import Card from "../components/ui/Card";
import ProgressCard from "../components/ui/ProgressCard";

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [statuses, setStatuses] = useState<StatusRecord[]>([]);
  const [durations, setDurations] = useState<DurationRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setIsLoading(true);
      setError("");
      try {
        const [projectData, taskData, statusData, durationData, memberData] = await Promise.all([
          requestApiData<ProjectRecord[]>("/api?resource=projects", { signal: controller.signal }),
          requestApiData<TaskRecord[]>("/api?resource=tasks", { signal: controller.signal }),
          requestApiData<StatusRecord[]>("/api?resource=statuses", { signal: controller.signal }),
          requestApiData<DurationRecord[]>("/api?resource=durations", { signal: controller.signal }),
          requestApiData<MemberRecord[]>("/api?resource=members", { signal: controller.signal }),
        ]);
        setProjects(projectData);
        setTasks(taskData);
        setStatuses(statusData);
        setDurations(durationData);
        setMembers(memberData);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger le tableau de bord.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
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
  const projectById = useMemo(
    () => new Map(projects.map((project) => [String(project.id_projet), project])),
    [projects],
  );
  const taskCountByProject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      const key = String(task.id_projet);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const statusSummary = useMemo(
    () =>
      statuses.map((status) => ({
        ...status,
        projects: projects.filter(
          (project) => String(project.id_status) === String(status.id_status),
        ).length,
        tasks: tasks.filter(
          (task) => String(task.id_status) === String(status.id_status),
        ).length,
      })),
    [projects, statuses, tasks],
  );

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => numericId(b.id_projet) - numericId(a.id_projet))
        .slice(0, 5),
    [projects],
  );
  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => numericId(b.id_tache) - numericId(a.id_tache)).slice(0, 5),
    [tasks],
  );
  const upcomingDeadlines = useMemo(
    () =>
      projects
        .flatMap((project) => {
          const duration = durationById.get(String(project.id_durre));
          if (!duration?.limite) {
            return [];
          }
          const remaining = daysUntil(duration.limite);
          if (remaining === null) {
            return [];
          }
          return [{ project, deadline: duration.limite, remaining }];
        })
        .sort((first, second) => first.remaining - second.remaining)
        .slice(0, 5),
    [durationById, projects],
  );
  const groupProjects = projects.filter(
    (project) =>
      members.filter((member) => String(member.id_projet) === String(project.id_projet)).length > 1,
  ).length;

  const hasData = projects.length > 0 || tasks.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Vue d’ensemble
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="mt-2 text-foreground/70">
            Suivez vos projets, vos tâches et les prochaines échéances.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-secondary bg-light px-4 py-2.5 font-semibold text-primary transition hover:bg-base disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </header>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-error/30 bg-light p-4 text-sm text-error sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            Réessayer
          </button>
        </div>
      )}

      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Projets", value: projects.length, icon: FolderKanban, href: "/project", detail: "Voir les projets" },
          { label: "Tâches", value: tasks.length, icon: ListTodo, href: "/tache", detail: "Voir les tâches" },
          { label: "Projets en équipe", value: groupProjects, icon: UsersRound, href: "/project", detail: "Voir les équipes" },
          {
            label: "Tâches sans projet",
            value: tasks.filter((task) => !projectById.has(String(task.id_projet))).length,
            icon: CircleAlert,
            href: "/tache",
            detail: "Vérifier les tâches",
          },
        ].map(({ label, value, icon: Icon, href, detail }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-lg bg-primary/10 p-3 text-primary">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <Link
                to={href}
                aria-label={detail}
                className="text-primary transition hover:translate-x-0.5"
              >
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
            <p className="mt-5 text-sm text-foreground/70">{label}</p>
            <p className="mt-1 text-3xl font-bold">{isLoading || error ? "—" : value}</p>
          </Card>
        ))}
      </section>

      {isLoading ? (
        <p role="status" className="py-8 text-center text-sm text-foreground/70">
          Chargement du tableau de bord…
        </p>
      ) : !error && !hasData ? (
        <section className="rounded-2xl border border-dashed border-secondary bg-light px-6 py-12 text-center">
          <FolderKanban aria-hidden="true" className="mx-auto h-10 w-10 text-primary/70" />
          <h2 className="mt-4 text-lg font-semibold">Votre espace est prêt</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
            Créez un projet, choisissez le mode solo ou équipe, puis ajoutez vos tâches.
          </p>
          <Link
            to="/project/form"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-light hover:bg-foreground"
          >
            Créer un projet
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </section>
      ) : !error ? (
        <>
          <section aria-labelledby="dashboard-status-title" className="rounded-xl border border-secondary bg-light p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 id="dashboard-status-title" className="text-lg font-bold">
                  Avancement
                </h2>
                <p className="mt-1 text-sm text-foreground/70">
                  Répartition des projets et des tâches par statut.
                </p>
              </div>
              <ListChecks aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {statusSummary.map((status) => {
                const total = projects.length + tasks.length;
                return (
                  <ProgressCard
                    key={status.id_status}
                    label={status.status}
                    value={status.projects + status.tasks}
                    total={total}
                    badgeClassName={statusBadgeClass(status.code)}
                    detail={`${status.projects} projet${status.projects === 1 ? "" : "s"} · ${status.tasks} tâche${status.tasks === 1 ? "" : "s"}`}
                  />
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="dashboard-deadline-title" className="rounded-xl border border-secondary bg-light p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 id="dashboard-deadline-title" className="text-lg font-bold">
                    Échéances des projets
                  </h2>
                  <p className="mt-1 text-sm text-foreground/70">
                    Les dates limites les plus proches.
                  </p>
                </div>
                <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
              </div>
              {upcomingDeadlines.length === 0 ? (
                <p className="rounded-lg bg-base p-4 text-sm text-foreground/70">
                  Aucune échéance renseignée pour le moment.
                </p>
              ) : (
                <ul className="divide-y divide-secondary">
                  {upcomingDeadlines.map(({ project, deadline, remaining }) => (
                    <li key={project.id_projet} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <Link
                          to={`/project/${encodeURIComponent(String(project.id_projet))}/edit`}
                          className="truncate font-semibold text-primary hover:underline"
                        >
                          {project.nom}
                        </Link>
                        <p className="mt-1 text-xs text-foreground/60">
                          {statusById.get(String(project.id_status))?.status ?? "Sans statut"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium">{formatDate(deadline)}</p>
                        <p className={`mt-1 text-xs ${remaining < 0 ? "font-semibold text-error" : "text-foreground/60"}`}>
                          {remaining < 0
                            ? `En retard de ${Math.abs(remaining)} j`
                            : remaining === 0
                              ? "Aujourd’hui"
                              : `Dans ${remaining} j`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="dashboard-projects-title" className="rounded-xl border border-secondary bg-light p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id="dashboard-projects-title" className="text-lg font-bold">
                  Projets récents
                </h2>
                <Link to="/project" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Tous les projets
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
              {recentProjects.length === 0 ? (
                <p className="rounded-lg bg-base p-4 text-sm text-foreground/70">
                  Aucun projet à afficher.
                </p>
              ) : (
                <ul className="divide-y divide-secondary">
                  {recentProjects.map((project) => {
                    const count = taskCountByProject.get(String(project.id_projet)) ?? 0;
                    const status = statusById.get(String(project.id_status));
                    return (
                      <li key={project.id_projet} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <Link
                            to={`/project/${encodeURIComponent(String(project.id_projet))}/edit`}
                            className="truncate font-semibold text-primary hover:underline"
                          >
                            {project.nom}
                          </Link>
                          <p className="mt-1 text-xs text-foreground/60">
                            {status?.status ?? "Sans statut"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-base px-3 py-1 text-xs font-medium text-foreground/70">
                          {count} tâche{count === 1 ? "" : "s"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <section aria-labelledby="dashboard-tasks-title" className="rounded-xl border border-secondary bg-light p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="dashboard-tasks-title" className="text-lg font-bold">
                Tâches récentes
              </h2>
              <Link to="/tache" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Toutes les tâches
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            {recentTasks.length === 0 ? (
              <p className="rounded-lg bg-base p-4 text-sm text-foreground/70">
                Aucune tâche à afficher.
              </p>
            ) : (
              <ul className="divide-y divide-secondary">
                {recentTasks.map((task) => {
                  const project = projectById.get(String(task.id_projet));
                  const status = statusById.get(String(task.id_status));
                  return (
                    <li key={task.id_tache} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{task.nom}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-foreground/60">
                          <FolderKanban aria-hidden="true" className="h-3.5 w-3.5" />
                          <span className="truncate">{project?.nom ?? "Projet introuvable"}</span>
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status?.code)}`}>
                        {status?.status ?? "Sans statut"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
