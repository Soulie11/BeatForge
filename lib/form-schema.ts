import { z } from "zod";

// ── Step 1: Welcome - username validation with regex & refine ───────
const usernameRegex = /^[a-zA-Z0-9_-]+$/;

export const welcomeSchema = z.object({
  username: z
    .string()
    .min(3, "Nazwa musi miec co najmniej 3 znaki")
    .max(20, "Nazwa nie moze miec wiecej niz 20 znakow")
    .regex(usernameRegex, "Dozwolone tylko litery, cyfry, _ i -")
    .refine(
      (val) => !val.toLowerCase().startsWith("admin"),
      "Nazwa nie moze zaczynac sie od 'admin'"
    ),
});

// ── Step 2: Genre selection ─────────────────────────────────────────
export const genreSchema = z.object({
  genre: z.enum(["metal", "rap", "pop", "videogame"], {
    required_error: "Wybierz gatunek muzyczny",
  }),
});

// ── Step 3: Preferences - mix name with regex ───────────────────────
const mixNameRegex = /^[a-zA-Z0-9\s_-]+$/;

export const preferencesSchema = z.object({
  mixName: z
    .string()
    .min(2, "Nazwa miksu musi miec co najmniej 2 znaki")
    .max(30, "Nazwa miksu nie moze miec wiecej niz 30 znakow")
    .regex(mixNameRegex, "Dozwolone: litery, cyfry, spacje, _ i -")
    .refine(
      (val) => val.trim().length >= 2,
      "Nazwa miksu nie moze skladac sie z samych spacji"
    ),
  autoPlay: z.boolean().default(true),
});

// ── Combined schema for full form ───────────────────────────────────
export const fullFormSchema = welcomeSchema
  .merge(genreSchema)
  .merge(preferencesSchema);

export type WelcomeFormData = z.infer<typeof welcomeSchema>;
export type GenreFormData = z.infer<typeof genreSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type FullFormData = z.infer<typeof fullFormSchema>;
