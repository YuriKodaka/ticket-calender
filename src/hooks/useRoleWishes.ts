import { useCallback, useEffect, useState } from "react";
import type { MustSeeMap, RoleWishes } from "../types";
import { loadRoleWishes, saveRoleWishes } from "../lib/roleWishRepository";

export function useRoleWishes() {
  const [wishesByShow, setWishesByShow] = useState<MustSeeMap>(() => loadRoleWishes());

  useEffect(() => {
    saveRoleWishes(wishesByShow);
  }, [wishesByShow]);

  const getWish = useCallback(
    (showId: string): RoleWishes => wishesByShow[showId] ?? {},
    [wishesByShow]
  );

  const toggleActor = useCallback((showId: string, role: string, actor: string) => {
    setWishesByShow(prev => {
      const showWish = { ...(prev[showId] ?? {}) };
      const current = showWish[role] ?? [];
      showWish[role] = current.includes(actor)
        ? current.filter(a => a !== actor)
        : [...current, actor];
      return { ...prev, [showId]: showWish };
    });
  }, []);

  // 作品の希望をまるごと置き換える（全チェック／全解除用）
  const setWish = useCallback((showId: string, wish: RoleWishes) => {
    setWishesByShow(prev => ({ ...prev, [showId]: wish }));
  }, []);

  return { wishesByShow, getWish, toggleActor, setWish };
}
