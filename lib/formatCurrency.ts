export function formatNaira(amount: number): string {
  if (Number.isNaN(amount) || amount == null) return "₦0";
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
