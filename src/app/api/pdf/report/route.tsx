import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import ValuesReportPDF from '@/components/pdf/ValuesReportPDF';
import { VALUES_BY_ID } from '@/lib/data/values';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rankedValues, definitions } = body;

    if (!rankedValues || !Array.isArray(rankedValues) || rankedValues.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid rankedValues' },
        { status: 400 }
      );
    }

    // Build values array with all data
    const values = rankedValues.slice(0, 5).map((id: string) => {
      const value = VALUES_BY_ID[id];
      const def = definitions?.[id];

      return {
        id,
        name: value?.name || 'Unknown Value',
        tagline: def?.tagline || `${value?.name || 'This value'} guides your decisions`,
        definition: def?.definition,
        behavioralAnchors: def?.behavioralAnchors,
      };
    });

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      <ValuesReportPDF values={values} />
    );

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF as downloadable file
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ValuesLens-2026-Report.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}
