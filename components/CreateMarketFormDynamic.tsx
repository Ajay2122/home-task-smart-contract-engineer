"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAccount } from "wagmi";
import { useCreateMarket } from "@/lib/hooks/useCreateMarket";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const formSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(200, "Question must not exceed 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters"),
  outcomes: z
    .array(z.string().min(1, "Outcome cannot be empty").max(50))
    .min(2, "At least 2 outcomes required")
    .max(10, "Maximum 10 outcomes allowed"),
  resolutionDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const now = new Date();
    return selectedDate > now;
  }, "Resolution date must be in the future"),
  arbitrator: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  tokenType: z.enum(["ETH", "USDC"]),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateMarketFormDynamic() {
  const { address } = useAccount();
  const router = useRouter();
  const { createMarket, isPending, isConfirming, isSuccess, hash } =
    useCreateMarket();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      description: "",
      outcomes: ["", ""],
      resolutionDate: "",
      arbitrator: address || "",
      tokenType: "ETH",
    },
  });

  // Update arbitrator when address changes
  useEffect(() => {
    if (address) {
      form.setValue("arbitrator", address);
    }
  }, [address, form]);

  const outcomes = form.watch("outcomes");

  const addOutcome = () => {
    if (outcomes.length < 10) {
      form.setValue("outcomes", [...outcomes, ""]);
    }
  };

  const removeOutcome = (index: number) => {
    if (outcomes.length > 2) {
      const newOutcomes = outcomes.filter((_, i) => i !== index);
      form.setValue("outcomes", newOutcomes);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!address) {
      toast.error("Please connect your wallet to create a market");
      return;
    }

    // Filter out empty outcomes
    const validOutcomes = values.outcomes.filter(o => o.trim() !== "");

    if (validOutcomes.length < 2) {
      toast.error("Please provide at least 2 valid outcomes");
      return;
    }

    setIsSubmitting(true);

    try {
      const resolutionTime = Math.floor(
        new Date(values.resolutionDate).getTime() / 1000
      );

      const tokenAddress =
        values.tokenType === "ETH"
          ? "0x0000000000000000000000000000000000000000"
          : (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS as `0x${string}`);

      createMarket(
        values.question,
        values.description,
        validOutcomes,
        resolutionTime,
        values.arbitrator,
        tokenAddress
      );
    } catch (error) {
      console.error("Error creating market:", error);
      toast.error("Failed to create market. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Market Created!", {
        description: `Transaction confirmed: ${hash.slice(0, 10)}...`,
      });
      router.push("/");
    }
  }, [isSuccess, hash, router]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Market Question</FormLabel>
              <FormControl>
                <Input
                  placeholder="Will Bitcoin reach $100k by end of 2025?"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Clear, specific question that can be objectively resolved
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide detailed context about this market..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include resolution criteria and any important context
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic Outcomes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <FormLabel>Outcomes</FormLabel>
              <FormDescription>
                Add 2-10 possible outcomes for this market
              </FormDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOutcome}
              disabled={outcomes.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Outcome
            </Button>
          </div>

          <div className="space-y-3">
            {outcomes.map((_, index) => (
              <div key={index} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`outcomes.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`Outcome ${index + 1}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {outcomes.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOutcome(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {form.formState.errors.outcomes && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.outcomes.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="resolutionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution Date</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormDescription>
                When this market can be resolved
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="arbitrator"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arbitrator Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="0x..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Address authorized to resolve this market
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tokenType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Betting Token</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="ETH" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      ETH (Native currency)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="USDC" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      USDC (Stablecoin)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || isConfirming || isSubmitting}
        >
          {isPending || isConfirming
            ? "Creating Market..."
            : "Create Market"}
        </Button>
      </form>
    </Form>
  );
}
