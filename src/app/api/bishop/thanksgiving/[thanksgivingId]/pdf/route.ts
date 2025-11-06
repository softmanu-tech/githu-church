import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireSessionAndRoles } from '@/lib/authMiddleware';
import { Thanksgiving } from '@/lib/models/Thanksgiving';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// GET generate PDF for thanksgiving message
export async function GET(
  request: Request,
  { params }: { params: { thanksgivingId: string } }
) {
  try {
    const { user } = await requireSessionAndRoles(request, ['bishop']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thanksgivingId } = params;

    await dbConnect();

    const thanksgivingMessage = await Thanksgiving.findById(thanksgivingId)
      .populate('member', 'name email phone');

    if (!thanksgivingMessage) {
      return NextResponse.json({ error: 'Thanksgiving message not found' }, { status: 404 });
    }

    // Create PDF using jsPDF
    const doc = new jsPDF();
    
    // Set up colors
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const textColor: [number, number, number] = [30, 64, 175]; // Blue text
    const darkText: [number, number, number] = [31, 41, 55]; // Dark gray for main text
    const lightGray: [number, number, number] = [248, 250, 252]; // Light background
    
    // Blue Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Add the actual logo image using base64
    try {
      // Read the logo file and convert to base64
      const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      const logoDataUri = `data:image/jpeg;base64,${logoBase64}`;
      
      // Add logo image to PDF
      doc.addImage(logoDataUri, 'JPEG', 10, 10, 30, 30);
    } catch (error) {
      console.log('Logo loading failed, using fallback:', error);
      // Fallback: simple text logo if image fails to load
      doc.setFillColor(255, 255, 255);
      doc.circle(25, 25, 12, 'F');
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('G-45', 25, 28, { align: 'center' });
    }
    
    // Church name and ministry - positioned to the right of logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Githurai 45 Main Altar', 50, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('The Ministry of Repentance and Holiness', 50, 35);
    
    // Date in header
    doc.setFontSize(10);
    doc.text(format(new Date(), 'MMMM dd, yyyy'), 150, 15);
    
    let yPosition = 70;
    
    // Simple Thanksgiving Format
    doc.setTextColor(...darkText);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Thanksgiving: ${thanksgivingMessage.title}`, 20, yPosition);
    
    yPosition += 20;
    
    // Thanksgiving Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Thanksgiving Details', 20, yPosition);
    
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Split long text into multiple lines
    const descriptionLines = doc.splitTextToSize(thanksgivingMessage.description, 170);
    doc.text(descriptionLines, 20, yPosition);
    
    yPosition += 8 + (descriptionLines.length * 4) + 20;
    
    // Footer with Member Information
    yPosition += 30;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    
    yPosition += 15;
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Member Information:', 20, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${thanksgivingMessage.member.name}`, 20, yPosition);
    
    yPosition += 6;
    doc.text(`${thanksgivingMessage.member.email}`, 20, yPosition);
    
    if (thanksgivingMessage.member.phone) {
      yPosition += 6;
      doc.text(`${thanksgivingMessage.member.phone}`, 20, yPosition);
    }
    
    yPosition += 8;
    doc.setTextColor(100, 116, 139);
    doc.text(`Submitted: ${format(new Date(thanksgivingMessage.createdAt), 'MMMM dd, yyyy')}`, 20, yPosition);
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="thanksgiving-${thanksgivingId}.pdf"`
      }
    });

  } catch (error: unknown) {
    console.error('Generate PDF error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
