import { ArticleExplorer } from "@/components/articles/article-explorer";
import { requireUser } from "@/lib/auth/session";

export default async function SearchPage() {
  const user = await requireUser();
  return <ArticleExplorer isAdmin={user.role === "ADMIN"} />;
}
