// Junta classes condicionais (mini-clsx). Sem dependência externa.
// Uso: cn("base", condicao && "extra", props.className)
export type ClassValue = string | false | null | undefined;

export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
