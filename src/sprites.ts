export const spriteModules = import.meta.glob("./giraffe_sprites/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export function spriteUrl(stateKey: string, frame: number): string {
  return spriteModules[`./giraffe_sprites/${stateKey}-${frame}.png`] ?? "";
}
