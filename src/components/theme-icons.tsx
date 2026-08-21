import { Gamepad2, BookOpen, Camera, Sparkles, Code2, ChefHat, Tag } from "lucide-react";

export const ICONS_BY_KEY: Record<string, typeof Gamepad2> = {
  gamepad2: Gamepad2,
  "book-open": BookOpen,
  camera: Camera,
  sparkles: Sparkles,
  code2: Code2,
  "chef-hat": ChefHat,
  default: Tag,
};

const ACCENT_CLASSES: Record<string, string> = {
  amber: "bg-amber",
  teal: "bg-teal",
  clay: "bg-clay",
};

export function accentClass(accentColor: string): string {
  return ACCENT_CLASSES[accentColor] ?? ACCENT_CLASSES.amber;
}
