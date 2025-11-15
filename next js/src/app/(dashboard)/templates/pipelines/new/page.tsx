// src/app/(dashboard)/pipelines/new/page.tsx
import { redirect } from "next/navigation";

export default async function NewPipelineRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const template = Array.isArray(sp.template) ? sp.template[0] : sp.template;

  if (template) {
    redirect(`/templates/${template}`);
  }
  redirect("/templates");
}
