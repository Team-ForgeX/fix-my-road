import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session cookies locally (fast, non-blocking)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  const pathname = request.nextUrl.pathname;

  // Routes that require the user to be logged in
  const isAuthRoute = ["/dashboard", "/profile", "/report", "/reports", "/nearby", "/notifications"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  // Redirect logged-in verified users away from guest-only pages
  const isGuestOnlyRoute = pathname === "/login" || pathname === "/signup";

  if (isGuestOnlyRoute && user && user.email_confirmed_at) {
    // Fetch role only when needed for this redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = profile?.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protect authenticated routes — redirect to login if not signed in
  if (isAuthRoute || isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (!user.email_confirmed_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify";
      return NextResponse.redirect(url);
    }

    // For admin routes only, verify the role in the DB
    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
    // Note: we deliberately do NOT redirect admins away from client routes.
    // The client-side AuthContext shows the correct UI based on role.
  }

  return supabaseResponse;
}