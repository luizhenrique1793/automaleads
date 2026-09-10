import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkspace } from "./api.functions";
import type { Workspace } from "./types";

export const workspaceQueryOptions = queryOptions({
  queryKey: ["workspace"],
  queryFn: () => getWorkspace(),
  staleTime: 10_000,
});

const EMPTY: Workspace = {
  users: [],
  companies: [],
  projects: [],
  actions: [],
  tasks: [],
  logs: [],
  companyUsers: [],
  series: [],
};

export function useWorkspace() {
  const query = useQuery(workspaceQueryOptions);
  const data = query.data ?? EMPTY;
  const companyById = new Map(data.companies.map((c) => [c.id, c]));
  const projectById = new Map(data.projects.map((p) => [p.id, p]));
  const userById = new Map(data.users.map((u) => [u.id, u]));
  const actionById = new Map(data.actions.map((a) => [a.id, a]));
  return { ...query, data, companyById, projectById, userById, actionById };
}

export function useInvalidateWorkspace() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["workspace"] });
}
