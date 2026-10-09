import { ArrowRight, ListTodo, UsersRound, Workflow } from "lucide-react";
import { Link } from "react-router";

const sections = [
  {
    title: "Projets",
    description: "Organisez vos projets et suivez leur avancement.",
    to: "/project",
    icon: Workflow,
  },
  {
    title: "Tâches",
    description: "Retrouvez le travail à faire et les prochaines étapes.",
    to: "/tache",
    icon: ListTodo,
  },
  {
    title: "Équipe",
    description: "Consultez les personnes qui collaborent avec vous.",
    to: "/individu",
    icon: UsersRound,
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <section className="rounded-2xl border border-secondary bg-light p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Votre espace de travail
        </p>
        <div className="mt-4 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bienvenue 👋
            </h1>
            <p className="mt-3 text-base leading-relaxed text-foreground/70">
              Tous vos projets, vos tâches et votre équipe réunis au même endroit.
              Par quoi souhaitez-vous commencer ?
            </p>
          </div>
          <Link
            to="/project"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-light transition-colors hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Voir mes projets
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="home-sections-title">
        <div className="mb-5">
          <h2 id="home-sections-title" className="text-xl font-bold">
            Accès rapide
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Choisissez l’espace que vous souhaitez consulter.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {sections.map(({ title, description, to, icon: Icon }) => (
            <Link
              key={title}
              to={to}
              className="group flex min-h-40 flex-col rounded-xl border border-secondary bg-light p-5 transition-colors hover:border-primary hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex rounded-lg bg-base p-3 text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1"
                />
              </div>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
