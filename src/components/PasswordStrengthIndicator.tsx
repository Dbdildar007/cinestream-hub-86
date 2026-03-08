import { useMemo } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score: 2, label: "Medium", color: "bg-amber-500" };
  return { score: 3, label: "Strong", color: "bg-emerald-500" };
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5 -mt-1">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              level <= strength.score ? strength.color : "bg-muted/40"
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] md:text-xs font-medium transition-colors duration-300 ${
        strength.score === 1 ? "text-destructive" :
        strength.score === 2 ? "text-amber-500" :
        "text-emerald-500"
      }`}>
        {strength.label}
      </p>
    </div>
  );
}
