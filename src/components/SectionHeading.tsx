interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  hindi?: string;
}

export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
  hindi,
}: Props) => (
  <div className={`mb-10 ${align === "center" ? "text-center mx-auto max-w-2xl" : ""}`}>
    {eyebrow && (
      <div className="inline-block text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-3">
        {eyebrow}
      </div>
    )}
    <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
      {title}
    </h2>
    {hindi && (
      <p className="font-hindi text-lg text-secondary mt-2">{hindi}</p>
    )}
    {subtitle && (
      <p className="mt-4 text-base text-muted-foreground leading-relaxed">{subtitle}</p>
    )}
  </div>
);
