import { MatrixHomepage } from "@/components/matrix-homepage";
import { store } from "@/lib/server/in-memory-store";

export default function HomePage() {
  const competitions = store.listCompetitions().map((competition) => ({
    id: competition.id,
    slug: competition.slug,
    title: competition.title,
    status: competition.status
  }));
  return <MatrixHomepage competitions={competitions} />;
}
