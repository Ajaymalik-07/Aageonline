export async function GET() {
  return Response.json(
    {
      status: 'UP',
      service: '@aageonline/admin',
      port: process.env.PORT || 3001,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

