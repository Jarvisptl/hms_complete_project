import { jsPDF } from "jspdf";

function sanitizeFilename(value) {
  return String(value || "Hospital_Bill")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_");
}

function formatCurrency(amount) {
  const numericAmount = Number(amount || 0);
  return Number.isFinite(numericAmount) ? numericAmount.toFixed(2) : "0.00";
}

export function downloadBillPdf(bill) {
  if (bill.status !== "Paid") {
    window.alert("Bill PDF is available only after payment is marked as paid.");
    return;
  }

  const patientName =
    bill.patientId?.name || bill.appointmentId?.patientId?.name || "N/A";
  const doctorName = bill.appointmentId?.doctorId?.name || "N/A";
  const appointmentDate = bill.appointmentId?.appointmentDate || "N/A";
  const billDate = bill.createdAt
    ? new Date(bill.createdAt).toLocaleDateString()
    : "N/A";
  const amount = formatCurrency(bill.amount);
  const filename = `${sanitizeFilename(bill.billNo || "Hospital_Bill")}.pdf`;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const leftCardWidth = contentWidth / 2 - 10;
  const rightCardX = margin + contentWidth / 2 + 10;

  doc.setTextColor(37, 99, 235);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("MediCore HMS", margin, 52);

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Hospital Billing Statement", margin, 72);

  doc.setDrawColor(219, 234, 254);
  doc.setLineWidth(1.2);
  doc.line(margin, 88, pageWidth - margin, 88);

  doc.setTextColor(27, 42, 65);
  doc.setFillColor(250, 251, 253);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(margin, 110, leftCardWidth, 110, 10, 10, "FD");
  doc.roundedRect(rightCardX, 110, leftCardWidth, 110, 10, 10, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Patient Information", margin + 16, 135);
  doc.text("Billing Details", rightCardX + 16, 135);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Name: ${patientName}`, margin + 16, 160);
  doc.text(`Doctor: ${doctorName}`, margin + 16, 180);
  doc.text(`Appointment Date: ${appointmentDate}`, margin + 16, 200);

  doc.text(`Bill No: ${bill.billNo || "N/A"}`, rightCardX + 16, 160);
  doc.text(`Bill Date: ${billDate}`, rightCardX + 16, 180);
  doc.text(`Status: ${bill.status || "N/A"}`, rightCardX + 16, 200);

  doc.setFillColor(245, 247, 250);
  doc.rect(margin, 245, contentWidth, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(27, 42, 65);
  doc.text("Description", margin + 12, 263);
  doc.text("Notes", margin + 240, 263);
  doc.text("Amount", margin + contentWidth - 90, 263);

  doc.setFont("helvetica", "normal");
  const descriptionLines = doc.splitTextToSize(
    bill.description || "Consultation Charges",
    190,
  );
  const notesLines = doc.splitTextToSize(bill.notes || "—", 180);
  const rowHeight =
    Math.max(descriptionLines.length, notesLines.length) * 16 + 20;

  doc.setDrawColor(220, 226, 235);
  doc.rect(margin, 273, contentWidth, rowHeight);
  doc.text(descriptionLines, margin + 12, 292);
  doc.text(notesLines, margin + 240, 292);
  doc.text(`$${amount}`, margin + contentWidth - 90, 292);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(27, 42, 65);
  doc.text(`Total: $${amount}`, pageWidth - margin - 115, 273 + rowHeight + 34);

  doc.save(filename);
}
