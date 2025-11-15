import { apiClient } from "./apiClient";

export type Template = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  // whatever your backend returns
};

export async function getTemplates(): Promise<Template[]> {
  const { data } = await apiClient.get("/templates");
  return data;
}
