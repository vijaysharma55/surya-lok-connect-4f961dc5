/**
 * Mask Aadhaar numbers for display: 1234-5678-9012 -> XXXX-XXXX-9012
 */
export function maskAadhaar(value?: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX-XXXX-XXXX";
  const last4 = digits.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function maskMobile(value?: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "XXXXXX";
  return `XXXXXX${digits.slice(-4)}`;
}
