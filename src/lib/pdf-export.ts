import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CoAttainment, PoAttainment } from "./types";
import { formatPercent } from "./utils";

interface ReportData {
  title: string;
  courseName: string;
  courseCode: string;
  semester: string;
  coAttainments: CoAttainment[];
  poAttainments: PoAttainment[];
  generatedBy: string;
  generatedAt: string;
}

export function exportAttainmentReport(data: ReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("CO-PO Attainment Report", 14, 18);
  doc.setFontSize(10);
  doc.text(data.title, 14, 28);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  let y = 52;
  doc.text(`Course: ${data.courseCode} — ${data.courseName}`, 14, y);
  y += 8;
  doc.text(`Semester: ${data.semester}`, 14, y);
  y += 8;
  doc.text(`Generated: ${data.generatedAt} by ${data.generatedBy}`, 14, y);
  y += 14;

  doc.setFontSize(13);
  doc.setTextColor(88, 28, 135);
  doc.text("Course Outcome Attainment", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["CO", "Attainment", "Target", "Status"]],
    body: data.coAttainments.map((co) => [
      co.co_number,
      formatPercent(co.attainment),
      formatPercent(co.target),
      co.met ? "Met" : "Not Met",
    ]),
    headStyles: { fillColor: [88, 28, 135] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 14;

  doc.setFontSize(13);
  doc.setTextColor(88, 28, 135);
  doc.text("Program Outcome Attainment", 14, y);

  autoTable(doc, {
    startY: y + 4,
    head: [["PO", "Attainment"]],
    body: data.poAttainments.map((po) => [
      po.po_number,
      formatPercent(po.attainment),
    ]),
    headStyles: { fillColor: [88, 28, 135] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  doc.save(
    `attainment-${data.courseCode}-${new Date().toISOString().slice(0, 10)}.pdf`
  );
}
