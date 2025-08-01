import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/dashboard')) {
        // Create a response object to handle cookie updates
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        let supabase = null;
        if (typeof window !== 'undefined') {
            supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll()
                        },
                        setAll(cookiesToSet) {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                request.cookies.set(name, value)
                                response.cookies.set(name, value, options)
                            })
                        },
                    },
                }
            );
        } else {
            const { env } = await getCloudflareContext({ async: true })
            supabase = createServerClient(
                env.NEXT_PUBLIC_SUPABASE_URL!,
                env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll()
                        },
                        setAll(cookiesToSet) {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                request.cookies.set(name, value)
                                response.cookies.set(name, value, options)
                            })
                        },
                    },
                }
            );
        }

        // Check user session and refresh if needed
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !pathname.startsWith('/auth/login')) {
            console.log('redirect to login');
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
        if (user && (pathname.startsWith('/auth/login') || pathname === '/auth')) {
            console.log('redirect to dashboard');
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
}