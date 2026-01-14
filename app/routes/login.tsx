/**
 * @file login.tsx
 * @description User login/signup page. Separate from admin login.
 * Supports returnTo parameter for post-login redirect.
 * @module routes/login
 */

import { Form, redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { createAuth } from "@server/auth/auth";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import type { Route } from "./+types/login";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { LanguageToggle } from "~/components/ui/LanguageToggle";

interface ActionData {
  error?: string;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  const session = await auth.api.getSession({ headers: request.headers });

  if (session?.user) {
    const url = new URL(request.url);
    const returnTo = url.searchParams.get("returnTo") || "/dashboard";
    return redirect(returnTo);
  }

  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const isSignUp = formData.get("mode") === "signup";
  const returnTo = formData.get("returnTo") as string || "/dashboard";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const env = getEnv(context);
  const db = getDb(env);
  const auth = createAuth(db, env);

  try {
    if (isSignUp) {
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: email.split("@")[0],
        },
      });

      if (!result || !result.user) {
        return { error: "Sign up failed. Email may already be in use." };
      }

      // Sign in after signup
      const signInResult = await auth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      });

      if (!signInResult.ok) {
        return { error: "Account created but sign in failed. Please try logging in." };
      }

      return redirect(returnTo, {
        headers: signInResult.headers,
      });
    } else {
      const signInResult = await auth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      });

      if (!signInResult.ok) {
        return { error: "Invalid email or password" };
      }

      return redirect(returnTo, {
        headers: signInResult.headers,
      });
    }
  } catch (error) {
    console.error("[login] Error:", error);
    return { error: "Authentication failed. Please try again." };
  }
}

export default function LoginPage() {
  const { t } = useTranslation();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);

  const isSubmitting = navigation.state === "submitting";
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
      {/* Language toggle */}
      <nav className="absolute top-4 right-4">
        <LanguageToggle size="md" />
      </nav>

      <div className="w-full max-w-md">
        <Card padding="lg">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isSignUp ? t("login.create_account") : t("login.title")}
          </h1>
          <p className="text-text-secondary mb-6">
            {isSignUp ? t("login.signup_subtitle", "Create an account to get started") : t("login.subtitle")}
          </p>

          <Form method="post" className="space-y-4">
            <input type="hidden" name="mode" value={isSignUp ? "signup" : "signin"} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {t("login.email")}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("login.email_placeholder")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                {t("login.password")}
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={8}
                placeholder={t("login.password_placeholder")}
              />
            </div>

            {actionData?.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
                {actionData.error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (isSignUp ? t("login.signing_up", "Signing up...") : t("login.signing_in"))
                : (isSignUp ? t("login.sign_up", "Sign up") : t("login.sign_in"))}
            </Button>
          </Form>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-text-secondary text-center">
              {isSignUp ? t("login.already_have_account", "Already have an account?") : t("login.no_account")}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-accent hover:underline focus:outline-none"
              >
                {isSignUp ? t("login.sign_in") : t("login.create_account")}
              </button>
            </p>
          </div>
        </Card>

        <p className="mt-4 text-center text-text-secondary text-sm">
          <a href="/" className="hover:text-accent transition-colors">
            {t("login.back_home")}
          </a>
        </p>
      </div>
    </div>
  );
}
