import { useEffect, useState } from "react";
import { spriteUrl } from "../sprites";
import type { PetState } from "../types";

export function useSpriteFrame(pet?: PetState, intervalMs = 180): string {
  const [frame, setFrame] = useState(1);
  const totalFrames = pet?.meta.totalFrames ?? 4;

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setFrame((current) => (current % totalFrames) + 1);
    }, intervalMs);
    return () => window.clearInterval(timerId);
  }, [intervalMs, totalFrames]);

  if (!pet) return "";
  return spriteUrl(pet.meta.stateKey, frame);
}
