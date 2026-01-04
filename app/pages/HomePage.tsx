/**
 * @file HomePage.tsx
 * @description Home page component for the JustPlay application.
 * Allows users to select a story genre and start a new adventure.
 * Extracted from _index route for better separation of concerns.
 * @module app/pages/HomePage
 */

import { useState, useEffect } from "react";
import { Form } from "react-router";
import { House, Play } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Select } from "~/components/ui/Select";
import { LanguageToggle } from "~/components/ui/LanguageToggle";
import { GENRE_THEME_MAP, type StoryGenre } from "@shared/types/game";

// --- Types ---

export interface HomePageProps {
  /** Additional class names */
  className?: string;
}

// --- Genre Options ---

const GENRE_OPTIONS: Array<{ value: StoryGenre; labelKey: string }> = [
  { value: "东方玄幻", labelKey: "home.genres.xuanhuan" },
  { value: "西方魔幻", labelKey: "home.genres.magic" },
  { value: "赛博朋克", labelKey: "home.genres.cyberpunk" },
  { value: "悬疑解谜", labelKey: "home.genres.mystery" },
  { value: "末世科幻", labelKey: "home.genres.scifi" },
];

// --- Component ---

export function HomePage({ className = "" }: HomePageProps) {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState("default");
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre>("东方玄幻");

  // Handle genre change - update theme
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genre = e.target.value as StoryGenre;
    setSelectedGenre(genre);
    setTheme(GENRE_THEME_MAP[genre] || "default");
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-500 ${className}`}
    >
      {/* Language toggle navigation */}
      <nav className="absolute top-4 right-4">
        <LanguageToggle size="md" />
      </nav>

      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4 flex items-center justify-center gap-3 text-text-primary">
          <House size={48} weight="duotone" className="text-accent" />
          {t("app.title")}
        </h1>
        <p className="text-xl text-text-secondary max-w-lg">
          {t("app.description")}
        </p>
      </header>

      {/* Main content */}
      <main className="w-full max-w-md space-y-4">
        <Card padding="lg">
          <h2 className="text-2xl font-semibold mb-6 text-text-primary">
            {t("home.start_adventure")}
          </h2>

          <Form method="post" action="/game/new" className="space-y-6">
            {/* Hidden language input */}
            <input type="hidden" name="lng" value={i18n.language} />

            {/* Genre select */}
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

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              icon={<Play size={24} weight="fill" />}
            >
              {t("home.generate_story")}
            </Button>
          </Form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-20 text-text-secondary text-sm">
        {t("common.powered_by")}
      </footer>
    </div>
  );
}

export default HomePage;
