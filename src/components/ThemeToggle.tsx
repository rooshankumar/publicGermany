import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  variant?: "switch" | "icon";
  className?: string;
}

export default function ThemeToggle({ variant = "switch", className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
        className={className}
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <Switch
          checked={theme === "dark"}
          onCheckedChange={toggleTheme}
          aria-label="Toggle dark mode"
        />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
