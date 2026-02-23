export function GET() {
  return Response.json({
    ADMIN_SECRET: !!process.env.ADMIN_SECRET,
    NAVER_CLIENT_ID: !!process.env.NAVER_CLIENT_ID,
    NAVER_CLIENT_SECRET: !!process.env.NAVER_CLIENT_SECRET,
  });
}
