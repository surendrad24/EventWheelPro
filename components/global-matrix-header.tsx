"use client";

import { MatrixHeader } from "@/components/matrix-header";

type HeaderCompetition = {
  id: string;
  slug: string;
  title: string;
  themeKey?: string;
  status: string;
};

export function GlobalMatrixHeader({
  competitions
}: {
  competitions: HeaderCompetition[];
}) {
  return <MatrixHeader competitions={competitions} />;
}
