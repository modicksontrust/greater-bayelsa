import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateVoter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LGAS, SUPPORT_LEVELS, CONTACT_STATUSES, GENDERS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const voterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female"]),
  phone: z.string().optional(),
  vin: z.string().optional(),
  dateOfBirth: z.string().optional(),
  occupation: z.string().optional(),
  lga: z.string().min(1, "LGA is required"),
  ward: z.string().min(1, "Ward is required"),
  pollingUnit: z.string().min(1, "Polling Unit is required"),
  supportLevel: z.enum(["strong", "leaning", "undecided", "opposed", "unknown"]).default("unknown"),
  contactStatus: z.enum(["not_contacted", "contacted", "follow_up", "unreachable"]).default("not_contacted"),
  notes: z.string().optional(),
});

type VoterFormValues = z.infer<typeof voterSchema>;

export function RegisterVoter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createVoter = useCreateVoter();
  const mutateFnRef = useRef(createVoter.mutate);
  
  useEffect(() => {
    mutateFnRef.current = createVoter.mutate;
  }, [createVoter.mutate]);

  const form = useForm<VoterFormValues>({
    resolver: zodResolver(voterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "male",
      phone: "",
      vin: "",
      dateOfBirth: "",
      occupation: "",
      lga: "",
      ward: "",
      pollingUnit: "",
      supportLevel: "unknown",
      contactStatus: "not_contacted",
      notes: "",
    },
  });

  const onSubmit = (data: VoterFormValues) => {
    // Convert empty strings to undefined to match API schema optional fields
    const formattedData = {
      ...data,
      phone: data.phone || undefined,
      vin: data.vin || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      occupation: data.occupation || undefined,
      notes: data.notes || undefined,
    };

    mutateFnRef.current({ data: formattedData }, {
      onSuccess: (response) => {
        toast({
          title: "Voter Registered",
          description: "The voter has been successfully added to the database.",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/voters"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/summary"] });
        setLocation(`/admin/voters/${response.id}`);
      },
      onError: (error: any) => {
        toast({
          title: "Registration Failed",
          description: error?.response?.data?.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/voters" className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-full" })}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register Voter</h1>
          <p className="text-muted-foreground mt-1">Add a new constituent to the Greater Bayelsa database.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg">Voter Information</CardTitle>
          <CardDescription>All fields marked with an asterisk (*) are required.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Tari" {...field} data-testid="input-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ebi" {...field} data-testid="input-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDERS.map(g => (
                              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-dob" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="080..." {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Teacher, Trader" {...field} data-testid="input-occupation" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Voter Identification Number (VIN)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter 19-digit VIN if available" {...field} data-testid="input-vin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Location Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="lga"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LGA *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lga">
                              <SelectValue placeholder="Select LGA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LGAS.map(lga => (
                              <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ward *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ward 1" {...field} data-testid="input-ward" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pollingUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Polling Unit *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. PU 001" {...field} data-testid="input-pu" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Outreach Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supportLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-support">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUPPORT_LEVELS.map(level => (
                              <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-contact">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONTACT_STATUSES.map(status => (
                              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Outreach Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any relevant details from field officers..." 
                            className="resize-none min-h-[100px]" 
                            {...field} 
                            data-testid="input-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                <Link href="/admin/voters" className={buttonVariants({ variant: "outline" })} data-testid="btn-cancel">
                  Cancel
                </Link>
                <Button type="submit" disabled={createVoter.isPending} className="min-w-[150px]" data-testid="btn-submit">
                  {createVoter.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Voter Record"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
