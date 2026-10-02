import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LockKeyhole,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';

const resourceUrl = (resource, params = {}) => {
  const query = new URLSearchParams({ resource, ...params });
  return `/api?${query.toString()}`;
};

async function authRequest(action, body) {
  const response = await fetch(`/api?auth=${action}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'La requête a échoué.');
  }
  return result;
}

async function request(resource, { params, method = 'GET', body } = {}) {
  const response = await fetch(resourceUrl(resource, params), {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'La requête a échoué.');
    error.status = response.status;
    throw error;
  }
  return result;
}

function dateLabel(value) {
  if (!value) return 'Sans échéance';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Sans échéance';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function deadlineInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function App() {
  const [data, setData] = useState({ projects: [], tasks: [], statuses: [], durations: [], individuals: [] });
  const [auth, setAuth] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [page, setPage] = useState('overview');
  const [selectedProject, setSelectedProject] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function handleApiError(apiError) {
    if (apiError.status === 401) {
      setAuth({ authenticated: false, setupRequired: false, user: null });
      setData({ projects: [], tasks: [], statuses: [], durations: [], individuals: [] });
      setModal(null);
      setAuthError('Votre session a expiré. Connectez-vous à nouveau.');
      return;
    }
    setError(apiError.message);
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [projects, tasks, statuses, durations, individuals] = await Promise.all([
        request('projects'),
        request('tasks'),
        request('statuses'),
        request('durations'),
        request('individuals'),
      ]);
      setData({
        projects: projects.data,
        tasks: tasks.data,
        statuses: statuses.data,
        durations: durations.data,
        individuals: individuals.data,
      });
    } catch (loadError) {
      handleApiError(loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    authRequest('status')
      .then(({ data: authData }) => {
        if (!active) return;
        setAuth(authData);
        if (authData.authenticated) void loadData();
      })
      .catch((statusError) => {
        if (active) setAuthError(statusError.message);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const statusById = Object.fromEntries(data.statuses.map((status) => [status.id_status, status]));
  const durationById = Object.fromEntries(data.durations.map((duration) => [duration.id_durre, duration]));
  const projectById = Object.fromEntries(data.projects.map((project) => [project.id_projet, project]));
  const projectDeadlineById = Object.fromEntries(data.projects.map((project) => {
    const status = statusById[project.id_status];
    return [project.id_projet, status && durationById[status.id_durre]?.limite];
  }));
  const filteredTasks = data.tasks.filter((task) => {
    const matchesProject = selectedProject === 'all' || String(task.id_projet) === selectedProject;
    const matchesSearch = `${task.nom} ${projectById[task.id_projet]?.nom || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesProject && matchesSearch;
  });
  const filteredProjects = data.projects.filter((project) => {
    const matchesSearch = project.nom.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (selectedProject === 'all' || String(project.id_projet) === selectedProject);
  });

  async function createProject(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectName = form.get('name').trim();
    const dueDate = form.get('deadline').replace('T', ' ') + ':00';
    setBusy(true);
    try {
      const duration = await request('durations', {
        method: 'POST',
        body: { creation: new Date().toISOString().slice(0, 19).replace('T', ' '), limite: dueDate },
      });
      const status = await request('statuses', {
        method: 'POST',
        body: { status: 'En cours', id_durre: Number(duration.id) },
      });
      await request('projects', {
        method: 'POST',
        body: { nom: projectName, id_status: Number(status.id) },
      });
      setModal(null);
      setNotice('Projet créé. Vous pouvez maintenant y ajouter des tâches.');
      await loadData();
    } catch (createError) {
      handleApiError(createError);
    } finally {
      setBusy(false);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await request('tasks', {
        method: 'POST',
        body: { nom: form.get('name').trim(), id_projet: Number(form.get('project')) },
      });
      setModal(null);
      setNotice('Tâche ajoutée au projet.');
      await loadData();
    } catch (createError) {
      handleApiError(createError);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Supprimer la tâche « ${task.nom} » ?`)) return;
    try {
      await request('tasks', {
        method: 'DELETE',
        params: { id_tache: task.id_tache },
      });
      setNotice('Tâche supprimée.');
      await loadData();
    } catch (deleteError) {
      handleApiError(deleteError);
    }
  }

  async function submitAuth(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const signingUp = authMode === 'signup';
    if (signingUp && form.get('password') !== form.get('password_confirmation')) {
      setAuthError('Les mots de passe ne correspondent pas.');
      return;
    }
    const body = {
      email: form.get('email').trim(),
      password: form.get('password'),
    };
    if (signingUp) body.name = form.get('name').trim();
    setAuthBusy(true);
    setAuthError('');
    try {
      const result = await authRequest(signingUp ? 'register' : 'login', body);
      setAuth({ authenticated: true, setupRequired: false, user: result.data });
      await loadData();
    } catch (loginError) {
      setAuthError(loginError.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    setAuthBusy(true);
    try {
      await authRequest('logout', {});
      setAuth({ authenticated: false, setupRequired: false, user: null });
      setData({ projects: [], tasks: [], statuses: [], durations: [], individuals: [] });
      setPage('overview');
      setSelectedProject('all');
      setAuthError('');
    } catch (logoutError) {
      setAuthError(logoutError.message);
    } finally {
      setAuthBusy(false);
    }
  }

  const isTaskPage = page === 'tasks';
  const listCount = isTaskPage ? filteredTasks.length : filteredProjects.length;

  if (authLoading) {
    return <div className="auth-loading"><span className="loader" />Vérification de votre session…</div>;
  }

  if (!auth?.authenticated) {
    return <AuthScreen setupRequired={auth?.setupRequired} mode={authMode} onModeChange={(mode) => { setAuthMode(mode); setAuthError(''); }} busy={authBusy} error={authError} onSubmit={submitAuth} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#accueil" onClick={() => setPage('overview')}>
          <span className="brand-mark"><LayoutDashboard size={19} strokeWidth={2.4} /></span>
          <span>task<span className="brand-light">manager</span></span>
        </a>

        <div className="workspace-label">Espace de travail</div>
        <button className={`nav-link ${page === 'overview' ? 'active' : ''}`} aria-label="Vue d’ensemble" title="Vue d’ensemble" onClick={() => { setPage('overview'); setSelectedProject('all'); }}>
          <LayoutDashboard size={18} /> <span>Vue d’ensemble</span>
        </button>
        <button className={`nav-link ${page === 'projects' ? 'active' : ''}`} aria-label="Projets" title="Projets" onClick={() => { setPage('projects'); setSelectedProject('all'); }}>
          <FolderKanban size={18} /> <span>Projets</span><span className="nav-count">{data.projects.length}</span>
        </button>
        <button className={`nav-link ${isTaskPage ? 'active' : ''}`} aria-label="Tâches" title="Tâches" onClick={() => { setPage('tasks'); setSelectedProject('all'); }}>
          <ListTodo size={18} /> <span>Tâches</span><span className="nav-count">{data.tasks.length}</span>
        </button>

        <div className="sidebar-projects-heading">
          <span>VOS PROJETS</span>
          <button className="icon-button sidebar-add" title="Créer un projet" aria-label="Créer un projet" onClick={() => setModal({ type: 'project' })}>
            <Plus size={16} />
          </button>
        </div>
        <div className="sidebar-projects">
          {data.projects.slice(0, 5).map((project, index) => (
            <button className="sidebar-project" key={project.id_projet} onClick={() => { setSelectedProject(String(project.id_projet)); setPage('tasks'); }}>
              <span className={`project-dot dot-${index % 4}`} />
              <span className="sidebar-project-name">{project.nom}</span>
              <span className="sidebar-project-count">{data.tasks.filter((task) => String(task.id_projet) === String(project.id_projet)).length}</span>
            </button>
          ))}
          {data.projects.length === 0 && <p className="sidebar-empty">Vos projets apparaîtront ici.</p>}
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar">{auth.user.nom.slice(0, 2).toUpperCase()}</div>
          <div className="profile-copy"><strong>{auth.user.nom}</strong><span>{auth.user.email}</span></div>
          <button className="icon-button logout-button" title="Se déconnecter" aria-label="Se déconnecter" onClick={() => void logout()} disabled={authBusy}><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Mon espace</span><span className="breadcrumb-slash">/</span><strong>{isTaskPage ? 'Tâches' : page === 'projects' ? 'Projets' : 'Vue d’ensemble'}</strong></div>
          <div className="topbar-right">
            <span className="today-label"><CalendarDays size={15} /> {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span>
            <span className="topbar-avatar" title={auth.user.nom}>{auth.user.nom.slice(0, 2).toUpperCase()}</span>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> Votre espace de travail</div>
              <h1>{isTaskPage ? 'Les tâches, en clair.' : page === 'projects' ? 'Vos projets.' : 'Faisons avancer les choses.'}</h1>
              <p className="page-subtitle">{isTaskPage ? 'Retrouvez le travail à faire, projet par projet.' : 'Tous vos projets et leur prochaine échéance, au même endroit.'}</p>
            </div>
            <div className="welcome-actions">
              <button className="button button-secondary" onClick={() => void loadData()} disabled={loading} title="Actualiser les données">
                <RefreshCw size={16} className={loading ? 'spin' : ''} /><span>Actualiser</span>
              </button>
              <button className="button button-primary" onClick={() => setModal({ type: isTaskPage ? 'task' : 'project' })}>
                <Plus size={17} /><span>{isTaskPage ? 'Nouvelle tâche' : 'Nouveau projet'}</span>
              </button>
            </div>
          </section>

          {error && (
            <div className="alert" role="alert">
              <CircleAlert size={18} /><span>{error}</span>
              <button className="alert-dismiss" aria-label="Fermer le message" onClick={() => setError('')}><X size={16} /></button>
            </div>
          )}

          <section className="stats-row" aria-label="Résumé de l’espace de travail">
            <article className="stat-block stat-ink">
              <div className="stat-top"><span>Projets</span><span className="stat-icon"><FolderKanban size={17} /></span></div>
              <strong>{data.projects.length.toString().padStart(2, '0')}</strong>
              <span className="stat-foot">dans votre espace</span>
            </article>
            <article className="stat-block stat-lime">
              <div className="stat-top"><span>Tâches</span><span className="stat-icon"><ListTodo size={17} /></span></div>
              <strong>{data.tasks.length.toString().padStart(2, '0')}</strong>
              <span className="stat-foot">toutes catégories</span>
            </article>
            <article className="stat-block stat-coral">
              <div className="stat-top"><span>Collaborateurs</span><span className="stat-icon"><UsersRound size={17} /></span></div>
              <strong>{data.individuals.length.toString().padStart(2, '0')}</strong>
              <span className="stat-foot">dans l’annuaire</span>
            </article>
          </section>

          <section className="list-section">
            <div className="list-heading">
              <div className="list-title-group">
                <div className="section-kicker">VUE GÉNÉRALE <span className="section-kicker-dot" /></div>
                <h2>{isTaskPage ? 'Toutes les tâches' : 'Projets récents'}</h2>
              </div>
              <div className="list-tools">
                <label className="search-box">
                  <Search size={16} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isTaskPage ? 'Chercher une tâche' : 'Chercher un projet'} />
                  {search && <button className="search-clear" aria-label="Effacer la recherche" onClick={() => setSearch('')}><X size={14} /></button>}
                </label>
                {isTaskPage && (
                  <label className="filter-select">
                    <span className="sr-only">Filtrer par projet</span>
                    <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
                      <option value="all">Tous les projets</option>
                      {data.projects.map((project) => <option value={project.id_projet} key={project.id_projet}>{project.nom}</option>)}
                    </select>
                    <ChevronDown size={14} />
                  </label>
                )}
              </div>
            </div>

            {loading ? (
              <div className="loading-state"><span className="loader" /> Chargement de votre espace…</div>
            ) : isTaskPage ? (
              <TaskList tasks={filteredTasks} projectById={projectById} projectDeadlineById={projectDeadlineById} onDelete={deleteTask} onCreate={() => setModal({ type: 'task' })} />
            ) : (
              <ProjectList
                projects={filteredProjects}
                tasks={data.tasks}
                statusById={statusById}
                durationById={durationById}
                onOpen={(project) => { setSelectedProject(String(project.id_projet)); setPage('tasks'); }}
                onCreate={() => setModal({ type: 'project' })}
              />
            )}

            {!loading && <div className="list-footer"><span>{listCount} {isTaskPage ? 'tâche' : 'projet'}{listCount === 1 ? '' : 's'}</span><span className="footer-mark"><span /> À jour</span></div>}
          </section>

          <footer className="page-footer"><span>Task Manager</span><span>Un espace pour avancer, ensemble.</span><ArrowUpRight size={14} /></footer>
        </div>
      </main>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setModal(null); }}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-topline"><span>{modal.type === 'project' ? 'NOUVEAU PROJET' : 'NOUVELLE TÂCHE'}</span><button className="icon-button modal-close" aria-label="Fermer" onClick={() => setModal(null)} disabled={busy}><X size={18} /></button></div>
            <h2 id="modal-title">{modal.type === 'project' ? 'Un nouveau départ.' : 'Ajouter au programme.'}</h2>
            <p className="modal-description">{modal.type === 'project' ? 'Donnez un nom au projet et fixez une première échéance.' : 'Décrivez la tâche et rattachez-la à un projet.'}</p>
            <form onSubmit={modal.type === 'project' ? createProject : createTask} className="modal-form">
              <label className="field-label" htmlFor="item-name">{modal.type === 'project' ? 'Nom du projet' : 'Nom de la tâche'}</label>
              <input id="item-name" name="name" className="text-input" maxLength="50" placeholder={modal.type === 'project' ? 'Ex. Refonte du site' : 'Ex. Préparer le cahier des charges'} required autoFocus />
              {modal.type === 'project' ? (
                <>
                  <label className="field-label" htmlFor="project-deadline">Première échéance</label>
                  <input id="project-deadline" name="deadline" type="datetime-local" className="text-input" defaultValue={deadlineInputValue()} required />
                </>
              ) : (
                <>
                  <label className="field-label" htmlFor="task-project">Projet associé</label>
                  <select id="task-project" name="project" className="text-input" defaultValue={selectedProject !== 'all' ? selectedProject : data.projects[0]?.id_projet} required>
                    {data.projects.map((project) => <option value={project.id_projet} key={project.id_projet}>{project.nom}</option>)}
                  </select>
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={() => setModal(null)} disabled={busy}>Annuler</button>
                <button type="submit" className="button button-primary" disabled={busy || (modal.type === 'task' && data.projects.length === 0)}>
                  {busy ? <span className="loader loader-light" /> : <><Check size={16} />{modal.type === 'project' ? 'Créer le projet' : 'Ajouter la tâche'}</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {notice && <div className="toast" role="status"><Check size={17} />{notice}</div>}
    </div>
  );
}

function AuthScreen({ setupRequired, mode, onModeChange, busy, error, onSubmit }) {
  const signingUp = mode === 'signup';

  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <a className="auth-brand" href="#connexion">
          <span className="brand-mark"><LayoutDashboard size={19} strokeWidth={2.4} /></span>
          <span>task<span className="brand-light">manager</span></span>
        </a>
        <div className="auth-visual-copy">
          <span className="auth-kicker"><span /> VOTRE ESPACE DE TRAVAIL</span>
          <h1>Bonjour !<br /><em>Prêt à avancer ?</em></h1>
          <p>Retrouvez vos projets, vos tâches et votre équipe au même endroit.</p>
        </div>
        <div className="auth-visual-foot"><span>01</span><span>PLANIFIER</span><i /><span>02</span><span>AVANCER</span><i /><span>03</span><span>RÉUSSIR</span></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><span className="brand-mark"><LayoutDashboard size={18} /></span>task<span className="brand-light">manager</span></div>
          <div className="auth-form-heading">
            <p className="auth-overline">{signingUp ? (setupRequired ? 'PREMIER ACCÈS' : 'NOUVEAU COMPTE') : 'ESPACE SÉCURISÉ'}</p>
            <h2>{signingUp ? 'Create account' : 'Login'}</h2>
            <p className="auth-intro">{signingUp ? 'Créez votre accès à Task Manager.' : 'Connectez-vous à votre espace de travail.'}</p>
          </div>
          <form className="auth-form" onSubmit={onSubmit}>
            {signingUp && (
              <label className="auth-field"><span>Nom</span><input name="name" type="text" autoComplete="name" placeholder="Ex. Camille Martin" maxLength="50" required autoFocus /></label>
            )}
            <label className="auth-field"><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" required autoFocus={!signingUp} /></label>
            <label className="auth-field"><span>Mot de passe</span><input name="password" type="password" autoComplete={signingUp ? 'new-password' : 'current-password'} placeholder={signingUp ? '10 caractères minimum' : 'Votre mot de passe'} minLength={signingUp ? 10 : undefined} required /></label>
            {signingUp && <>
              <label className="auth-field"><span>Confirmer le mot de passe</span><input name="password_confirmation" type="password" autoComplete="new-password" placeholder="Saisissez-le à nouveau" minLength="10" required /></label>
              <p className="auth-password-hint">Conseil : utilisez une phrase longue et unique plutôt qu’un mot de passe réutilisé.</p>
            </>}
            {error && <div className="auth-error" role="alert"><CircleAlert size={16} /><span>{error}</span></div>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? <span className="loader loader-light" /> : <>{signingUp ? 'Sign up' : 'Login'}<ArrowUpRight size={17} /></>}
            </button>
          </form>
          <p className="auth-security"><LockKeyhole size={13} /> Connexion protégée · Mot de passe chiffré</p>
          <p className="auth-account-switch">
            {signingUp ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}
            <button type="button" onClick={() => onModeChange(signingUp ? 'login' : 'signup')}>{signingUp ? 'Sign in' : 'Sign up'}</button>
          </p>
        </div>
        <div className="auth-copyright"><span>Task Manager</span><span>Votre espace, vos projets.</span></div>
      </section>
    </main>
  );
}

function ProjectList({ projects, tasks, statusById, durationById, onOpen, onCreate }) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-illustration"><FolderKanban size={26} /><span className="empty-spark">+</span></div>
        <h3>Aucun projet pour le moment</h3>
        <p>Créez votre premier projet pour commencer à organiser le travail.</p>
        <button className="button button-primary" onClick={onCreate}><Plus size={16} />Créer un projet</button>
      </div>
    );
  }

  return (
    <div className="project-list">
      <div className="table-head project-grid"><span>PROJET</span><span>STATUT</span><span>TÂCHES</span><span>ÉCHÉANCE</span><span /></div>
      {projects.map((project, index) => {
        const status = statusById[project.id_status];
        const duration = status && durationById[status.id_durre];
        const taskCount = tasks.filter((task) => String(task.id_projet) === String(project.id_projet)).length;
        return (
          <button className="project-row project-grid" key={project.id_projet} onClick={() => onOpen(project)}>
            <span className="project-name-cell"><span className={`project-tile tile-${index % 4}`}><FolderKanban size={17} /></span><span className="project-name-wrap"><strong>{project.nom}</strong><small>Projet #{project.id_projet}</small></span></span>
            <span><span className={`status-pill ${String(status?.status || '').toLowerCase().includes('termin') ? 'status-done' : 'status-active'}`}><span />{status?.status || 'Sans statut'}</span></span>
            <span className="task-count-cell">{taskCount} tâche{taskCount === 1 ? '' : 's'}</span>
            <span className="deadline-cell"><CalendarDays size={15} />{dateLabel(duration?.limite)}</span>
            <span className="row-arrow"><ArrowUpRight size={17} /></span>
          </button>
        );
      })}
    </div>
  );
}

function TaskList({ tasks, projectById, projectDeadlineById, onDelete, onCreate }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state task-empty">
        <div className="empty-illustration empty-lime"><ListTodo size={26} /><span className="empty-spark">+</span></div>
        <h3>Rien à faire ici, pour l’instant</h3>
        <p>Ajoutez une tâche et elle apparaîtra dans cette liste.</p>
        {Object.keys(projectById).length > 0 && <button className="button button-primary" onClick={onCreate}><Plus size={16} />Créer une tâche</button>}
      </div>
    );
  }

  return (
    <div className="task-list">
      <div className="table-head task-grid"><span>TÂCHE</span><span>PROJET</span><span>ÉCHÉANCE DU PROJET</span><span /></div>
      {tasks.map((task, index) => (
        <TaskRow key={task.id_tache} task={task} project={projectById[task.id_projet]} deadline={projectDeadlineById[task.id_projet]} index={index} onDelete={onDelete} />
      ))}
    </div>
  );
}

function TaskRow({ task, project, deadline, index, onDelete }) {
  return (
    <div className="task-row task-grid">
      <span className="task-name-cell"><span className={`task-check task-check-${index % 3}`}><Check size={13} /></span><strong>{task.nom}</strong></span>
      <span className="task-project-label"><span className={`project-dot dot-${index % 4}`} />{project?.nom || 'Projet supprimé'}</span>
      <span className="task-date"><Clock3 size={15} />{dateLabel(deadline)}</span>
      <button className="icon-button delete-button" title="Supprimer la tâche" aria-label={`Supprimer ${task.nom}`} onClick={() => onDelete(task)}><Trash2 size={16} /></button>
    </div>
  );
}

export default App;