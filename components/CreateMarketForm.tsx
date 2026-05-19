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

const formSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(200, "Question must not exceed 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters"),
  outcome1: z.string().min(1, "Outcome 1 is required").max(50),
  outcome2: z.string().min(1, "Outcome 2 is required").max(50),
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

export function CreateMarketForm() {
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
      outcome1: "",
      outcome2: "",
      resolutionDate: "",
      arbitrator: address || "",
      tokenType: "ETH",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!address) {
      toast.error("Please connect your wallet to create a market");
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
        [values.outcome1, values.outcome2],
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="outcome1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outcome 1</FormLabel>
                <FormControl>
                  <Input placeholder="Yes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="outcome2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outcome 2</FormLabel>
                <FormControl>
                  <Input placeholder="No" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
