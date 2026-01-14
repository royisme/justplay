/**
 * @file LandingPage.tsx
 * @description Landing page introducing JustPlay and directing users to play.
 * @module app/pages/LandingPage
 */

import { Link } from "react-router";
import {
  PlayIcon,
  BookOpenIcon,
  SparkleIcon,
  GameControllerIcon,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Card } from "~/components/ui/Card";
import { LanguageToggle } from "~/components/ui/LanguageToggle";
import type { TranslationKey } from "~/types/i18next";

export function LandingPage() {
  const { t } = useTranslation();

  const features: Array<{
    icon: React.ReactNode;
    titleKey: TranslationKey;
    descKey: TranslationKey;
  }> = [
    {
      icon: <SparkleIcon size={32} weight="duotone" className="text-accent" />,
      titleKey: "landing.features.ai.title",
      descKey: "landing.features.ai.desc",
    },
    {
      icon: <BookOpenIcon size={32} weight="duotone" className="text-accent" />,
      titleKey: "landing.features.genres.title",
      descKey: "landing.features.genres.desc",
    },
    {
      icon: (
        <GameControllerIcon
          size={32}
          weight="duotone"
          className="text-accent"
        />
      ),
      titleKey: "landing.features.choices.title",
      descKey: "landing.features.choices.desc",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="absolute top-4 right-4 flex items-center gap-4">
        <LanguageToggle size="md" />
        <Link
          to="/auth/login"
          className="text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          {t("landing.admin_login")}
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-6 text-text-primary">
          {t("app.title")}
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mb-12">
          {t("landing.hero_description")}
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-4 text-lg font-medium rounded-xl bg-primary hover:bg-primary/90 text-background-primary shadow-md transition-all"
        >
          <PlayIcon size={24} weight="fill" />
          {t("landing.play_now")}
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-16 px-8 bg-background-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-text-primary">
            {t("landing.how_it_works")}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} padding="lg" className="text-center">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-text-primary">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-text-secondary text-sm">
                  {t(feature.descKey)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-text-secondary text-sm">
        {t("common.powered_by")}
      </footer>
    </div>
  );
}

export default LandingPage;
