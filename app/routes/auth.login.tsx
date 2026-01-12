/**
 * @file auth.login.tsx
 * @description Login page using Better Auth.
 * @module routes/auth.login
 */

import { Form, redirect, useActionData, useNavigation } from "react-router";
import { createAuth, type AuthUser } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { user as userTable } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/auth.login";

// --- Types ---

interface ActionData {
  error?: string;
}

// --- Loader ---

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  // Check if user is already logged in
  const session = await auth.api.getSession({ headers: request.headers });

  if (session?.user) {
    // Get role from database
    const dbUser = await db.query.user.findFirst({
      where: eq(userTable.id, session.user.id),
    });
    if (dbUser?.role === "admin") {
      return redirect("/admin");
    }
  }

  return { adminEmail: env.ADMIN_EMAIL };
}

// --- Action ---

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const isSignUp = formData.get("mode") === "signup";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  try {
    if (isSignUp) {
      // Sign up
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: email.split("@")[0], // Use email prefix as name
        },
      });

      if (!result || !result.user) {
        return { error: "Sign up failed. Email may already be in use." };
      }

      // Get user role from database
      const dbUser = await db.query.user.findFirst({
        where: eq(userTable.id, result.user.id),
      });

      if (dbUser?.role !== "admin") {
        return { error: "Access denied. Admin privileges required." };
      }

      // Sign in to get session cookie
      const signInResult = await auth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      });

      if (!signInResult.ok) {
        return { error: "Account created but sign in failed. Please try logging in." };
      }

      // Return redirect with cookies from response
      return redirect("/admin", {
        headers: signInResult.headers,
      });
    } else {
      // Sign in
      const signInResult = await auth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      });

      if (!signInResult.ok) {
        return { error: "Invalid email or password" };
      }

      // Parse the response to get user info
      const responseData = (await signInResult.clone().json()) as {
        user?: { id: string };
      };

      // Get user role from database
      const dbUser = await db.query.user.findFirst({
        where: eq(userTable.id, responseData.user?.id ?? ""),
      });

      if (dbUser?.role !== "admin") {
        return { error: "Access denied. Admin privileges required." };
      }

      return redirect("/admin", {
        headers: signInResult.headers,
      });
    }
  } catch (error) {
    console.error("[auth.login] Error:", error);
    return { error: "Authentication failed. Please try again." };
  }
}

// --- Component ---

export default function LoginPage() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
      <div className="w-full max-w-md">
        <div className="bg-background-secondary rounded-2xl border border-border p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Admin Login
          </h1>
          <p className="text-text-secondary mb-6">
            Sign in to access the admin panel.
          </p>

          <Form method="post" className="space-y-4">
            <input type="hidden" name="mode" value="signin" />

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all text-text-primary"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                minLength={8}
                className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all text-text-primary"
                placeholder="Enter password"
              />
            </div>

            {actionData?.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
                {actionData.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </Form>

          <div className="mt-4 pt-4 border-t border-border">
            <Form method="post" className="space-y-4">
              <input type="hidden" name="mode" value="signup" />
              <input type="hidden" name="email" id="signup-email" />
              <input type="hidden" name="password" id="signup-password" />
              <p className="text-sm text-text-secondary text-center">
                First time?{" "}
                <button
                  type="submit"
                  onClick={(e) => {
                    const mainForm = document.querySelector(
                      'form input[name="mode"][value="signin"]'
                    )?.closest("form");
                    const thisForm = e.currentTarget.closest("form");
                    if (mainForm && thisForm) {
                      const mainEmail = mainForm.querySelector(
                        'input[name="email"]'
                      ) as HTMLInputElement;
                      const mainPassword = mainForm.querySelector(
                        'input[name="password"]'
                      ) as HTMLInputElement;
                      const signupEmail = thisForm.querySelector(
                        "#signup-email"
                      ) as HTMLInputElement;
                      const signupPassword = thisForm.querySelector(
                        "#signup-password"
                      ) as HTMLInputElement;
                      if (signupEmail && mainEmail)
                        signupEmail.value = mainEmail.value;
                      if (signupPassword && mainPassword)
                        signupPassword.value = mainPassword.value;
                    }
                  }}
                  className="text-accent hover:underline"
                >
                  Create account
                </button>
              </p>
            </Form>
          </div>
        </div>

        <p className="mt-4 text-center text-text-secondary text-sm">
          <a href="/" className="hover:text-accent transition-colors">
            Back to Home
          </a>
        </p>
      </div>
    </div>
  );
}
