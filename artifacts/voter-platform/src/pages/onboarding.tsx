import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useMatchVoter, 
  useRegisterMember, 
  MemberInput,
  getMatchVoterQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ArrowRight, UserCheck } from "lucide-react";
import { LGAS, GENDERS, MEMBERSHIP_CATEGORIES } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";

const lookupSchema = z.object({
  q: z.string().min(4, "Please enter at least 4 characters of your VIN or phone number"),
});

const memberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Phone number is required"),
  vin: z.string().min(4, "VIN is required"),
  lga: z.string().min(1, "LGA is required"),
  ward: z.string().min(1, "Ward is required"),
  pollingUnit: z.string().min(1, "Polling Unit is required"),
  membershipCategory: z.enum(["full_time", "part_time"]),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["male", "female"]).optional(),
  dateOfBirth: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [lookupQuery, setLookupQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const { data: matchedVoters, isLoading: isLookingUp, error: lookupError } = useMatchVoter(
    { q: lookupQuery }, 
    { query: { enabled: lookupQuery.length >= 4, retry: false, queryKey: getMatchVoterQueryKey({ q: lookupQuery }) } }
  );

  const matchedVoter = matchedVoters && matchedVoters.length > 0 ? matchedVoters[0] : null;
  
  const registerMember = useRegisterMember();
  
  const lookupForm = useForm({
    resolver: zodResolver(lookupSchema),
    defaultValues: { q: "" },
  });

  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      vin: "",
      lga: "",
      ward: "",
      pollingUnit: "",
      membershipCategory: "part_time",
      email: "",
      gender: undefined,
      dateOfBirth: "",
      occupation: "",
      address: "",
    },
  });

  const onLookup = (data: { q: string }) => {
    setLookupQuery(data.q);
  };

  // Prefill when matched
  useEffect(() => {
    if (matchedVoter) {
        memberForm.reset({
          firstName: matchedVoter.firstName || "",
          lastName: matchedVoter.lastName || "",
          phone: lookupQuery.match(/^\d+$/) ? lookupQuery : "",
          vin: !lookupQuery.match(/^\d{10,11}$/) ? lookupQuery : "",
          lga: matchedVoter.lga || "",
          ward: matchedVoter.ward || "",
          pollingUnit: matchedVoter.pollingUnit || "",
          membershipCategory: "part_time",
          email: "",
          gender: (matchedVoter.gender as "male" | "female") || undefined,
          dateOfBirth: matchedVoter.dateOfBirth ? matchedVoter.dateOfBirth.split('T')[0] : "",
          occupation: matchedVoter.occupation || "",
          address: "",
        });
      }
  }, [matchedVoter, memberForm, lookupQuery]);

  const onSubmitMember = (data: MemberFormValues) => {
    const formattedData: MemberInput = {
      ...data,
      email: data.email || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth || null,
      occupation: data.occupation || null,
      address: data.address || null,
      photoUrl: null,
    };

    registerMember.mutate({ data: formattedData }, {
      onSuccess: () => {
        toast({
          title: "Registration Successful",
          description: "Welcome to Greater Bayelsa!",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Registration Failed",
          description: err?.response?.data?.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-serif mb-3">Complete Your Profile</h1>
        <p className="text-muted-foreground">
          Welcome to the Greater Bayelsa Portal! Please complete your membership registration to access the dashboard.
        </p>
      </div>

      {!matchedVoter && !manualMode ? (
        <Card className="border-border/50 shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle>Step 1: Voter Verification</CardTitle>
            <CardDescription>
              We prioritize verified citizens of Bayelsa State. Enter your Voter Identification Number (VIN) or phone number to look up your existing record.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...lookupForm}>
              <form onSubmit={lookupForm.handleSubmit(onLookup)} className="flex gap-3">
                <FormField
                  control={lookupForm.control}
                  name="q"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <Input 
                          placeholder="Enter VIN or phone number..." 
                          className="h-12" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="h-12 px-6 font-bold" disabled={isLookingUp}>
                  {isLookingUp ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
                </Button>
              </form>
            </Form>
            
            {(lookupError ||
              (lookupQuery.length >= 4 && !isLookingUp && matchedVoters && matchedVoters.length === 0)) && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center border border-border">
                <p className="text-muted-foreground text-sm mb-4">
                  We couldn't find a matching voter record. You can still register manually, but you must provide your VIN.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const q = lookupQuery;
                    memberForm.reset({
                      ...memberForm.getValues(),
                      phone: /^\d{10,11}$/.test(q) ? q : "",
                      vin: /^\d{10,11}$/.test(q) ? "" : q,
                    });
                    setManualMode(true);
                  }}
                >
                  Proceed to Manual Registration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-md animate-in-stagger">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-primary">Step 2: Member Details</CardTitle>
                <CardDescription>
                  {matchedVoter
                    ? "Voter record found! Please confirm and complete your details."
                    : "Please provide your full details."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...memberForm}>
              <form onSubmit={memberForm.handleSubmit(onSubmitMember)} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={memberForm.control} name="firstName" render={({ field }) => (
                    <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={memberForm.control} name="lastName" render={({ field }) => (
                    <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={memberForm.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={memberForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={memberForm.control} name="vin" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Voter Identification Number (VIN) *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <FormField control={memberForm.control} name="lga" render={({ field }) => (
                    <FormItem>
                      <FormLabel>LGA *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select LGA" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {LGAS.map(lga => <SelectItem key={lga} value={lga}>{lga}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={memberForm.control} name="ward" render={({ field }) => (
                    <FormItem><FormLabel>Ward *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={memberForm.control} name="pollingUnit" render={({ field }) => (
                    <FormItem><FormLabel>Polling Unit *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FormField control={memberForm.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={memberForm.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={memberForm.control} name="occupation" render={({ field }) => (
                    <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={memberForm.control} name="membershipCategory" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membership Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {MEMBERSHIP_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={memberForm.control} name="address" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Residential Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="flex justify-end gap-3 border-t pt-6">
                  <Button type="button" variant="ghost" onClick={() => setLookupQuery("")}>Start Over</Button>
                  <Button type="submit" disabled={registerMember.isPending} className="font-bold gap-2">
                    {registerMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Complete Registration <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}