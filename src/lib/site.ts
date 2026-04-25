export const SITE = {
  name: "Surya Lok Kalyan Foundation",
  shortName: "SLKF",
  domain: "www.suryalok.online",
  url: "https://www.suryalok.online",
  email: "slkf02026@gmail.com",
  phones: ["7520585153", "7319935455"] as const,
  primaryPhone: "7520585153",
  whatsappNumber: "917520585153", // E.164 without +
  address: "Mithapur, Patna, Bihar, India",
  hours: "9:15 AM – 5:00 PM (Sunday closed)",
  established: "24 May 2026",
  compliance: ["80G", "12A", "10AC"] as const,
  mapEmbed:
    "https://www.google.com/maps?q=Mithapur,+Patna,+Bihar,+India&output=embed",
};

export const waLink = (message?: string) => {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

export const telLink = (phone: string = SITE.primaryPhone) => `tel:+91${phone}`;
export const mailLink = (subject?: string) =>
  `mailto:${SITE.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
