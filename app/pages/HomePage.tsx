/**
 * @file HomePage.tsx
 * @description Home page for starting a new adventure.
 * Features immersive loading states during story generation.
 */

import { useState, useEffect } from "react";
import { Form, useNavigation } from "react-router";
import { BookOpenIcon, SparkleIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Card } from "~/components/ui/Card";
import { Select } from "~/components/ui/Select";
import { LanguageToggle } from "~/components/ui/LanguageToggle";
import { LoadingOverlay } from "~/components/ui/LoadingOverlay";
import { GENRE_THEME_MAP, type StoryGenre } from "@shared/types/game";
import type { TranslationKey } from "~/types/i18next";

export interface HomePageProps {
  className?: string;
}

const GENRE_OPTIONS: Array<{
  value: StoryGenre;
  labelKey: TranslationKey;
  icon: string;
}> = [
  { value: "东方玄幻", labelKey: "home.genres.xuanhuan", icon: "玄" },
  { value: "西方魔幻", labelKey: "home.genres.magic", icon: "魔" },
  { value: "赛博朋克", labelKey: "home.genres.cyberpunk", icon: "赛" },
  { value: "悬疑解谜", labelKey: "home.genres.mystery", icon: "谜" },
  { value: "末世科幻", labelKey: "home.genres.scifi", icon: "末" },
];

export function HomePage({ className = "" }: HomePageProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [theme, setTheme] = useState("default");
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre>("东方玄幻");
  const [loadingPhase, setLoadingPhase] = useState(0);

  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";

  // Handle genre change
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genre = e.target.value as StoryGenre;
    setSelectedGenre(genre);
    setTheme(GENRE_THEME_MAP[genre] || "default");
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Simulate loading phases during submission
  useEffect(() => {
    if (!isSubmitting) {
      setLoadingPhase(0);
      return;
    }

    const phaseTimers = [
      setTimeout(() => setLoadingPhase(1), 3000),
      setTimeout(() => setLoadingPhase(2), 7000),
    ];

    return () => phaseTimers.forEach(clearTimeout);
  }, [isSubmitting]);

  const selectedOption = GENRE_OPTIONS.find((o) => o.value === selectedGenre);

  return (
    <>
      {/* Immersive Loading Overlay */}
      <LoadingOverlay isVisible={isSubmitting} currentPhase={loadingPhase} />

      <div
        className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-500 ${className}`}
      >
        {/* Language toggle */}
        <nav className="absolute top-4 right-4">
          <LanguageToggle size="md" />
        </nav>

        {/* Header */}
        <header className="mb-12 text-center animate-fade-in">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <BookOpenIcon
                size={64}
                weight="duotone"
                className="text-accent animate-bounce-subtle"
              />
              <SparkleIcon
                size={24}
                weight="fill"
                className="absolute -top-1 -right-1 text-accent/70"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 text-text-primary">
            {t("app.title")}
          </h1>
          <p className="text-xl text-text-secondary max-w-lg">
            {t("app.description")}
          </p>
        </header>

        {/* Main content */}
        <main className="w-full max-w-md">
          <Card padding="lg" className="animate-slide-up">
            <h2 className="text-2xl font-semibold mb-6 text-text-primary">
              {t("home.start_adventure")}
            </h2>

            <Form method="post" action="/game/new" className="space-y-6">
              <input type="hidden" name="language" value={i18n.language} />

              {/* Genre Select with Preview */}
              <div className="space-y-3">
                <Select
                  name="story_type"
                  label={t("home.select_genre")}
                  value={selectedGenre}
                  onChange={handleGenreChange}
                  fullWidth
                >
                  {GENRE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>

                {/* Genre Preview Card */}
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-center gap-4 transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-2xl font-serif text-accent">
                    {selectedOption?.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary">
                      {t("home.genre_preview", "即将进入...")}
                    </p>
                    <p className="font-medium text-text-primary">
                      {selectedOption && t(selectedOption.labelKey)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full py-4 px-6 rounded-xl bg-primary text-background-primary font-medium text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
              >
                {/* Shimmer effect on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />

                <span className="relative flex items-center justify-center gap-3">
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t("game.loading")}
                    </>
                  ) : (
                    <>
                      <SparkleIcon size={24} weight="fill" />
                      {t("home.generate_story")}
                    </>
                  )}
                </span>
              </button>
            </Form>
          </Card>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-text-secondary/60 text-sm animate-fade-in-delayed">
          {t("common.powered_by")}
        </footer>
      </div>
    </>
  );
}

export default HomePage;
