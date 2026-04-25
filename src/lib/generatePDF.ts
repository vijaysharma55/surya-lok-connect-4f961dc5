import jsPDF from "jspdf";
import html2canvas from "html2canvas";

async function rasterize(node: HTMLElement) {
  return await html2canvas(node, {
    scale: 3, // ~300dpi feel
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
}

export async function generateIdCardPDF(node: HTMLElement, fileName: string) {
  const canvas = await rasterize(node);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
    compress: true,
  });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(fileName);
}

export async function generateIdCardPNG(node: HTMLElement, fileName: string) {
  const canvas = await rasterize(node);
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export const safeFileName = (name: string, ext: "pdf" | "png" = "pdf") =>
  `Volunteer_ID_${(name || "User").trim().replace(/[^A-Za-z0-9]+/g, "_")}.${ext}`;
