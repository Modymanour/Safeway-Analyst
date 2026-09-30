export function cn(...inputs) {
  return inputs.flatMap((input) => {
    if (typeof input === "string" && input) return [input];
    if (Array.isArray(input)) return input.filter(Boolean);
    if (input && typeof input === "object") return Object.entries(input).filter(([, enabled]) => enabled).map(([name]) => name);
    return [];
  }).join(" ");
}
