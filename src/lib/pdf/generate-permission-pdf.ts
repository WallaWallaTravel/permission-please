import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface PermissionPdfData {
  formTitle: string;
  formDescription: string;
  eventDate: Date;
  eventType: string;
  deadline: Date;
  teacherName: string;
  schoolName?: string;
  studentName: string;
  studentGrade: string;
  parentName: string;
  parentEmail: string;
  signatureDataUrl: string; // base64 PNG
  signedAt: Date;
  ipAddress?: string;
  fieldResponses?: Array<{ label: string; response: string }>;
}

export async function generatePermissionPdf(data: PermissionPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;

  // Colors
  const primaryColor = rgb(0.118, 0.227, 0.373); // #1e3a5f
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.6, 0.6, 0.6);

  // Helper function to draw text and return new Y position
  const drawText = (
    text: string,
    x: number,
    y: number,
    options: { font?: typeof helvetica; size?: number; color?: typeof textColor } = {}
  ) => {
    const { font = helvetica, size = 11, color = textColor } = options;
    page.drawText(text, { x, y, font, size, color });
    return y - size - 4;
  };

  // Helper to wrap text
  const wrapText = (text: string, maxWidth: number, font: typeof helvetica, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Header
  yPosition = drawText('PERMISSION SLIP', margin, yPosition, {
    font: helveticaBold,
    size: 24,
    color: primaryColor,
  });
  yPosition -= 5;

  // School name if available
  if (data.schoolName) {
    yPosition = drawText(data.schoolName, margin, yPosition, {
      font: helvetica,
      size: 12,
      color: lightGray,
    });
  }

  // Horizontal line
  yPosition -= 10;
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  yPosition -= 20;

  // Form Title
  yPosition = drawText(data.formTitle, margin, yPosition, {
    font: helveticaBold,
    size: 16,
    color: textColor,
  });
  yPosition -= 10;

  // Event Details Box
  const boxY = yPosition;
  const boxHeight = 70;
  page.drawRectangle({
    x: margin,
    y: boxY - boxHeight,
    width: width - 2 * margin,
    height: boxHeight,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  // Event details inside box
  const eventDateStr = data.eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const deadlineStr = data.deadline.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  drawText('Event Date:', margin + 10, boxY - 20, { font: helveticaBold, size: 10 });
  drawText(eventDateStr, margin + 80, boxY - 20, { size: 10 });

  drawText('Event Type:', margin + 10, boxY - 35, { font: helveticaBold, size: 10 });
  drawText(data.eventType.replace('_', ' '), margin + 80, boxY - 35, { size: 10 });

  drawText('Deadline:', margin + 10, boxY - 50, { font: helveticaBold, size: 10 });
  drawText(deadlineStr, margin + 80, boxY - 50, { size: 10 });

  drawText('Teacher:', margin + 300, boxY - 20, { font: helveticaBold, size: 10 });
  drawText(data.teacherName, margin + 355, boxY - 20, { size: 10 });

  yPosition = boxY - boxHeight - 20;

  // Description
  yPosition = drawText('Event Description:', margin, yPosition, { font: helveticaBold, size: 11 });
  yPosition -= 5;

  const descLines = wrapText(data.formDescription, width - 2 * margin, helvetica, 10);
  for (const line of descLines.slice(0, 6)) {
    // Limit to 6 lines
    yPosition = drawText(line, margin, yPosition, { size: 10 });
  }
  if (descLines.length > 6) {
    yPosition = drawText('...', margin, yPosition, { size: 10, color: lightGray });
  }

  yPosition -= 15;

  // Field Responses (if any)
  if (data.fieldResponses && data.fieldResponses.length > 0) {
    yPosition = drawText('Additional Information:', margin, yPosition, { font: helveticaBold, size: 11 });
    yPosition -= 5;

    for (const field of data.fieldResponses.slice(0, 5)) {
      // Limit to 5 fields
      yPosition = drawText(`${field.label}:`, margin + 10, yPosition, { font: helveticaBold, size: 9 });
      const responseLines = wrapText(field.response, width - 2 * margin - 20, helvetica, 9);
      for (const line of responseLines.slice(0, 2)) {
        yPosition = drawText(line, margin + 20, yPosition, { size: 9 });
      }
      yPosition -= 5;
    }
    yPosition -= 10;
  }

  // Student Information
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  yPosition -= 15;

  yPosition = drawText('STUDENT INFORMATION', margin, yPosition, {
    font: helveticaBold,
    size: 12,
    color: primaryColor,
  });
  yPosition -= 5;

  drawText('Student Name:', margin, yPosition, { font: helveticaBold, size: 10 });
  drawText(data.studentName, margin + 90, yPosition, { size: 10 });
  yPosition -= 15;

  drawText('Grade:', margin, yPosition, { font: helveticaBold, size: 10 });
  drawText(data.studentGrade, margin + 90, yPosition, { size: 10 });
  yPosition -= 25;

  // Parent/Guardian Section
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  yPosition -= 15;

  yPosition = drawText('PARENT/GUARDIAN AUTHORIZATION', margin, yPosition, {
    font: helveticaBold,
    size: 12,
    color: primaryColor,
  });
  yPosition -= 10;

  // Authorization text
  const authText = `I, the undersigned parent/guardian of ${data.studentName}, hereby grant permission for my child to participate in the above-described activity. I understand and accept all terms and conditions associated with this activity.`;
  const authLines = wrapText(authText, width - 2 * margin, helvetica, 10);
  for (const line of authLines) {
    yPosition = drawText(line, margin, yPosition, { size: 10 });
  }

  yPosition -= 20;

  // Signature
  yPosition = drawText('Electronic Signature:', margin, yPosition, { font: helveticaBold, size: 10 });
  yPosition -= 5;

  // Embed signature image
  try {
    // Remove data URL prefix to get raw base64
    const base64Data = data.signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const signatureBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    const sigWidth = 200;
    const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;

    page.drawImage(signatureImage, {
      x: margin,
      y: yPosition - sigHeight,
      width: sigWidth,
      height: sigHeight,
    });

    yPosition -= sigHeight + 5;
  } catch {
    yPosition = drawText('[Signature on file]', margin, yPosition - 30, {
      size: 10,
      color: lightGray,
    });
    yPosition -= 10;
  }

  // Signature line
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + 250, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPosition -= 15;

  // Parent info
  drawText('Parent/Guardian:', margin, yPosition, { font: helveticaBold, size: 9 });
  drawText(data.parentName, margin + 90, yPosition, { size: 9 });
  yPosition -= 12;

  drawText('Email:', margin, yPosition, { font: helveticaBold, size: 9 });
  drawText(data.parentEmail, margin + 90, yPosition, { size: 9 });
  yPosition -= 12;

  drawText('Signed At:', margin, yPosition, { font: helveticaBold, size: 9 });
  drawText(
    data.signedAt.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
    }),
    margin + 90,
    yPosition,
    { size: 9 }
  );
  yPosition -= 12;

  if (data.ipAddress) {
    drawText('IP Address:', margin, yPosition, { font: helveticaBold, size: 9 });
    drawText(data.ipAddress, margin + 90, yPosition, { size: 9, color: lightGray });
  }

  // Footer
  const footerY = 30;
  page.drawLine({
    start: { x: margin, y: footerY + 15 },
    end: { x: width - margin, y: footerY + 15 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });

  page.drawText('Generated by Permission Please - Digital Permission Slips', {
    x: margin,
    y: footerY,
    font: helvetica,
    size: 8,
    color: lightGray,
  });

  page.drawText(new Date().toISOString(), {
    x: width - margin - 120,
    y: footerY,
    font: helvetica,
    size: 8,
    color: lightGray,
  });

  return pdfDoc.save();
}
