import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function preferredTheme(): Theme {
  const savedTheme = window.localStorage.getItem("liliya-theme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const initialTheme = preferredTheme();
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.style.colorScheme = initialTheme;
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem("liliya-theme", nextTheme);
    setTheme(nextTheme);
  };

  if (!theme) return null;

  const dark = theme === "dark";

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
        title={dark ? "Светлая тема" : "Тёмная тема"}
        onClick={toggleTheme}
        className="size-11 rounded-full border-ink/15 bg-cream/90 text-ink shadow-lg backdrop-blur-md hover:bg-paper"
      >
        {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </Button>
    </div>
  );
}