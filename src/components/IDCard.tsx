import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SunLogo } from "@/components/SunLogo";
import { IdCard, Phone, ShieldCheck } from "lucide-react";

export type IDCardData = {
  application_code: string;
  full_name: string;
  post: string;
  district: string;
  block: string;
  panchayat: string;
  mobile: string;
  email?: string | null;
  photo_url?: string | null;
  approved_at?: string | null;
};

type Props = {
  data: IDCardData;
  emergencyContact?: string;
  validUntil?: string;
  /** Absolute URL embedded in the QR code. Defaults to current origin + /verify/:code */
  verifyUrl?: string;
};

/**
 * Hidden, print-ready volunteer ID card. Rendered off-screen and converted
 * to PDF via html2canvas + jsPDF on download.
 */
export const IDCard = forwardRef<HTMLDivElement, Props>(
  ({ data, emergencyContact = "+91 90000 00000", validUntil, verifyUrl }, ref) => {
    const issued = data.approved_at ? new Date(data.approved_at) : new Date();
    const validity =
      validUntil ??
      new Date(issued.getFullYear() + 1, issued.getMonth(), issued.getDate()).toLocaleDateString("en-IN");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const qrValue = verifyUrl ?? `${origin}/verify/${data.application_code}`;

    return (
      <div
        ref={ref}
        style={{
          width: 720,
          height: 440,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#0f172a",
          background: "#ffffff",
          border: "2px solid #f59e0b",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 10px 30px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            background: "linear-gradient(90deg,#f59e0b,#ef4444)",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SunLogo size={42} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.5 }}>
                Surya Lok Unified
              </div>
              <div style={{ fontSize: 11, opacity: 0.9, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Volunteer Identification Card
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              border: "1.5px solid #ffffff",
              borderRadius: 999,
              letterSpacing: 1,
            }}
          >
            ACTIVE
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", padding: 24, gap: 20, height: 280 }}>
          {/* Photo */}
          <div
            style={{
              width: 140,
              height: 170,
              borderRadius: 8,
              border: "2px solid #f59e0b",
              background: "#fef3c7",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {data.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photo_url}
                alt={data.full_name}
                crossOrigin="anonymous"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <IdCard size={56} color="#b45309" />
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{data.full_name}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#b45309", marginTop: 4 }}>
              {data.post}
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 6, columnGap: 14, fontSize: 12 }}>
              <Field label="ID No." value={data.application_code} mono />
              <Field label="Mobile" value={data.mobile} />
              <Field label="District" value={data.district} />
              <Field label="Block" value={data.block} />
              <Field label="Panchayat" value={data.panchayat} />
              <Field label="Issued" value={issued.toLocaleDateString("en-IN")} />
            </div>
          </div>

          {/* Verified stamp + QR */}
          <div
            style={{
              width: 130,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 10,
              alignSelf: "stretch",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                border: "2px dashed #16a34a",
                borderRadius: 10,
                color: "#15803d",
                padding: "6px 8px",
                transform: "rotate(-6deg)",
                width: 96,
              }}
            >
              <ShieldCheck size={22} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>VERIFIED</div>
              <div style={{ fontSize: 8, opacity: 0.8 }}>SLKF Office</div>
            </div>
            <div
              style={{
                background: "#ffffff",
                padding: 6,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QRCodeSVG value={qrValue} size={96} level="M" includeMargin={false} />
            </div>
            <div style={{ fontSize: 8, color: "#64748b", textAlign: "center", lineHeight: 1.2 }}>
              Scan to verify
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 24px",
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: 11,
          }}
        >
          <div>
            <span style={{ opacity: 0.7 }}>Valid until:</span>{" "}
            <span style={{ fontWeight: 700 }}>{validity}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Phone size={12} />
            <span style={{ opacity: 0.85 }}>Emergency:</span>
            <span style={{ fontWeight: 700 }}>{emergencyContact}</span>
          </div>
        </div>
      </div>
    );
  },
);
IDCard.displayName = "IDCard";

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#64748b" }}>
        {label}
      </div>
      <div
        style={{
          fontWeight: 600,
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}
