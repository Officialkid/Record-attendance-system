import { NextResponse } from 'next/server';

const expiredCookie = {
  expires: new Date(0),
  maxAge: 0,
  path: '/',
};

const cookieNames = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
  'authjs.callback-url',
  '__Secure-authjs.callback-url',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'authjs.csrf-token',
  '__Host-authjs.csrf-token',
];

export async function GET(request: Request) {
  const url = new URL('/login?reset=1', request.url);
  const response = NextResponse.redirect(url);

  for (const name of cookieNames) {
    response.cookies.set(name, '', expiredCookie);
  }

  return response;
}
