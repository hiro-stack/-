import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  // 環境変数で設定されたユーザー名とパスワード
  // 設定されていない場合は認証なしで通す（開発中の利便性のため）
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !password) {
    return NextResponse.next();
  }

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [u, p] = atob(authValue).split(':');

    if (u === user && p === password) {
      return NextResponse.next();
    }
  }

  url.pathname = '/api/auth';

  return new NextResponse('Basic Auth Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
