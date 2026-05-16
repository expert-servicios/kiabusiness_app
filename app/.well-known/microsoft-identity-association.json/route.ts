import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    associatedApplications: [
      {
        applicationId: '0d95d7e0-8c25-4d01-92d7-42a8dd5607d3',
      },
    ],
  });
}
