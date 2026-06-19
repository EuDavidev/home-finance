/**
 * Utility to conditionally join classNames together.
 * Filters out falsy values (false, null, undefined, "").
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
