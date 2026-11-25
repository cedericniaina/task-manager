export type StatusCode = "todo" | "in_progress" | "done";
export type Importance = "Urgente" | "Importante" | "Non importante";

export interface StatusRecord {
  id_status: number | string;
  code: StatusCode | string;
  status: string;
}

export interface DurationRecord {
  id_durre: number | string;
  creation: string | null;
  limite: string | null;
}

export interface ProjectRecord {
  id_projet: number | string;
  nom: string;
  description: string | null;
  id_status: number | string;
  id_durre: number | string | null;
  id_utilisateur: number | string;
}

export interface TaskRecord {
  id_tache: number | string;
  nom: string;
  description: string | null;
  id_projet: number | string;
  id_status: number | string;
  importance: Importance;
}

export interface IndividualRecord {
  id_individue: number | string;
  nom: string;
  photo_profil: string | null;
  id_utilisateur: number | string | null;
}

export interface MemberRecord {
  id_projet: number | string;
  id_individue: number | string;
  role: "chef" | "membre";
}

export interface AssignmentRecord {
  id_tache: number | string;
  id_individue: number | string;
  role: string | null;
}

// Alias conservés pour les anciens imports.
export type ProjectStatus = StatusRecord;
export type ProjectDuration = DurationRecord;
export type ProjectTask = TaskRecord;

export interface AuthStatus {
  authenticated: boolean;
  setupRequired: boolean;
  user: { id_utilisateur: number; nom: string; email: string } | null;
}

export interface SaveProjectPayload {
  id_projet?: number | string;
  nom: string;
  description?: string | null;
  id_status: number | string;
  limite?: string | null;
  membres?: Array<number | string>;
}

export interface SaveTaskPayload {
  id_tache?: number | string;
  nom: string;
  description?: string | null;
  id_projet: number | string;
  id_status: number | string;
  importance: Importance;
  assignes?: Array<number | string>;
}

interface ApiEnvelope<T> {
  data: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function requestApi<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, credentials: "include" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error("Impossible de contacter le serveur. Vérifiez que l’API est démarrée.", {
      cause: error,
    });
  }

  const responseBody = await response.text();
  let result: unknown;
  try {
    result = JSON.parse(responseBody) as unknown;
  } catch {
    if ([502, 503, 504].includes(response.status)) {
      throw new Error(
        "L’API PHP ne répond pas. Démarrez-la sur le port 8000 depuis la racine du projet.",
      );
    }
    throw new Error(
      `L’API a renvoyé une réponse invalide (HTTP ${response.status}). Vérifiez les journaux du serveur PHP.`,
    );
  }

  if (!response.ok) {
    const message =
      isRecord(result) && typeof result.error === "string"
        ? result.error
        : "La requête a échoué. Veuillez réessayer.";
    throw new Error(message);
  }

  return result as T;
}

export async function requestApiData<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const result = await requestApi<ApiEnvelope<T>>(url, options);
  if (!isRecord(result) || !("data" in result)) {
    throw new Error("La réponse de l’API ne contient pas les données attendues.");
  }
  return result.data as T;
}

export async function saveProject(payload: SaveProjectPayload): Promise<number> {
  const result = await requestApi<ApiEnvelope<{ id_projet: number }>>(
    "/api?action=project.save",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return Number(result.data.id_projet);
}

export async function saveTask(payload: SaveTaskPayload): Promise<number> {
  const result = await requestApi<ApiEnvelope<{ id_tache: number }>>(
    "/api?action=task.save",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return Number(result.data.id_tache);
}

export async function patchResource(
  resource: string,
  keyName: string,
  id: number | string,
  body: Record<string, unknown>,
): Promise<void> {
  await requestApi(
    `/api?resource=${encodeURIComponent(resource)}&${encodeURIComponent(keyName)}=${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function deleteResource(
  resource: string,
  keyName: string,
  id: number | string,
): Promise<void> {
  await requestApi(
    `/api?resource=${encodeURIComponent(resource)}&${encodeURIComponent(keyName)}=${encodeURIComponent(String(id))}`,
    { method: "DELETE" },
  );
}

export const IMPORTANCE_OPTIONS: Importance[] = [
  "Urgente",
  "Importante",
  "Non importante",
];

export function numericId(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const datePart = value.slice(0, 10);
  const date = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

export function statusBadgeClass(code: StatusCode | string | undefined): string {
  if (code === "done") {
    return "bg-success/15 text-success";
  }
  if (code === "in_progress") {
    return "bg-warning/20 text-warning";
  }
  return "bg-primary/10 text-primary";
}

export function importanceBadgeClass(importance: Importance): string {
  if (importance === "Urgente") {
    return "bg-error/10 text-error";
  }
  if (importance === "Importante") {
    return "bg-warning/20 text-warning";
  }
  return "bg-base text-foreground/70";
}
