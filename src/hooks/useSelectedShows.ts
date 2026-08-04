import { useCallback, useEffect, useState } from "react";
import { loadSelectedShowIds, saveSelectedShowIds } from "../lib/selectedShowsRepository";

export function useSelectedShows() {
  const [selectedShowIds, setSelectedShowIds] = useState<string[]>(() => loadSelectedShowIds());

  useEffect(() => {
    saveSelectedShowIds(selectedShowIds);
  }, [selectedShowIds]);

  const toggleShow = useCallback((showId: string) => {
    setSelectedShowIds(prev =>
      prev.includes(showId) ? prev.filter(id => id !== showId) : [...prev, showId]
    );
  }, []);

  return { selectedShowIds, toggleShow };
}
