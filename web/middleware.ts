// app/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import {isTokenExpired} from "pocketbase";

const PUBLIC_FILE = /\.(.*)$/;

/**
 * Middleware to check for authentication on protected routes
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes and static files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        PUBLIC_FILE.test(pathname)
    ) {
        return NextResponse.next();
    }

    const authCookie = request.cookies.get('pb_auth');
    const parsedAuthCookie = JSON.parse(authCookie?.value || "{}");
    const { token, model } = parsedAuthCookie;

    if (!token || isTokenExpired(token)) {
        console.error('something wrong in middleware; authCookie:', authCookie)
        db.authStore.clear();
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // if we're in a client-side context
    if (typeof window === 'undefined') {
        // sync the auth token and model to the client instance
        db.authStore.save(token, model);
    }

    try {
        await db.collection('users').authRefresh();
    } catch (error) {
        db.authStore.clear();
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}