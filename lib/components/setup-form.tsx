"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GenreSelector } from "@/components/genre-selector";
import {
  fullFormSchema,
  type FullFormData,
} from "@/lib/form-schema";
import type { FormStep, Genre } from "@/lib/types";
import { isGenre } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Music2, Sparkles, User } from "lucide-react";

type SetupFormProps = {
  onComplete: (data: FullFormData) => void;
};

const STEP_CONFIG: Record<
  FormStep,
  { title: string; description: string; icon: React.ReactNode }
> = {
  welcome: {
    title: "Witaj w BeatForge",
    description: "Podaj swoja nazwe uzytkownika, aby rozpoczac",
    icon: <User className="h-6 w-6" />,
  },
  genre: {
    title: "Wybierz gatunek",
    description: "Jaki styl muzyczny chcesz miksowac?",
    icon: <Music2 className="h-6 w-6" />,
  },
  preferences: {
    title: "Ustawienia miksu",
    description: "Nadaj nazwe swojemu miksowi",
    icon: <Sparkles className="h-6 w-6" />,
  },
};

const STEPS: FormStep[] = ["welcome", "genre", "preferences"];

export function SetupForm({ onComplete }: SetupFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>("welcome");
  const currentStepIndex = STEPS.indexOf(currentStep);
  const progressValue = ((currentStepIndex + 1) / STEPS.length) * 100;

  const form = useForm<FullFormData>({
    resolver: zodResolver(fullFormSchema),
    defaultValues: {
      username: "",
      genre: undefined,
      mixName: "",
      autoPlay: true,
    },
    mode: "onTouched",
  });

  async function handleNext() {
    let fieldsToValidate: (keyof FullFormData)[] = [];

    if (currentStep === "welcome") {
      fieldsToValidate = ["username"];
    } else if (currentStep === "genre") {
      fieldsToValidate = ["genre"];
    } else if (currentStep === "preferences") {
      fieldsToValidate = ["mixName", "autoPlay"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    } else {
      const values = form.getValues();
      if (isGenre(values.genre)) {
        onComplete(values);
      }
    }
  }

  function handleBack() {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }

  const config = STEP_CONFIG[currentStep];

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {config.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-balance">
            {config.title}
          </CardTitle>
          <CardDescription className="text-pretty">
            {config.description}
          </CardDescription>
          <div className="pt-4">
            <Progress value={progressValue} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {"Krok"} {currentStepIndex + 1} {"z"} {STEPS.length}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="flex flex-col gap-6"
            >
              {/* Step 1: Welcome */}
              <div
                className={cn(
                  "animate-float-up",
                  currentStep !== "welcome" && "hidden"
                )}
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwa uzytkownika</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="np. DJ_Master"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Litery, cyfry, podkreslnik i myslnik (3-20 znakow)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Step 2: Genre */}
              <div
                className={cn(
                  "animate-float-up",
                  currentStep !== "genre" && "hidden"
                )}
              >
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Gatunek</FormLabel>
                      <FormControl>
                        <GenreSelector
                          value={field.value as Genre | undefined}
                          onChange={(g) => field.onChange(g)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Step 3: Preferences */}
              <div
                className={cn(
                  "flex flex-col gap-6 animate-float-up",
                  currentStep !== "preferences" && "hidden"
                )}
              >
                <FormField
                  control={form.control}
                  name="mixName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwa miksu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="np. Nocny Jam"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Nadaj swietna nazwe swojej sesji
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoPlay"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-1">
                        <FormLabel>Auto-play</FormLabel>
                        <FormDescription>
                          Automatycznie startuj odtwarzanie
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStepIndex === 0}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Wstecz</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Wroc do poprzedniego kroku</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        className="gap-2"
                      >
                        <span>
                          {currentStepIndex === STEPS.length - 1
                            ? "Rozpocznij miksowanie"
                            : "Dalej"}
                        </span>
                        {currentStepIndex < STEPS.length - 1 && (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {currentStepIndex === STEPS.length - 1
                        ? "Przejdz do miksera"
                        : "Przejdz do nastepnego kroku"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
