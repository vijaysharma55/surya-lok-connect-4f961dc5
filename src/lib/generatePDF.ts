import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateIdCardPDF(node: HTMLElement, fileName: string) {
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL("image/png");
  // Landscape ID card sized to canvas aspect
  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
    compress: true,
  });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(fileName);
}

export const safeFileName = (name: string) =>
  `Volunteer_ID_${(name || "User").trim().replace(/[^A-Za-z0-9]+/g, "_")}.pdf`;
