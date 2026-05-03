import { notFound } from "next/navigation";
import { StratAPIApp } from "@/components/app/stratapi-app";
import { isPageId } from "@/lib/page-routes";

type WorkspaceRouteProps = {
  params: Promise<{
    page: string;
  }>;
};

export default async function WorkspaceRoute({ params }: WorkspaceRouteProps) {
  const { page } = await params;

  if (!isPageId(page)) {
    notFound();
  }

  return <StratAPIApp initialPage={page} />;
}
