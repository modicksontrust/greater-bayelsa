import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetVoter, useUpdateVoter, useDeleteVoter, getGetVoterQueryKey, getListVotersQueryKey, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  ArrowLeft, Edit2, Trash2, User, Phone, Briefcase, Hash, 
  Calendar, MapPin, CheckCircle2, AlertTriangle, Loader2 
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LGAS, SUPPORT_LEVELS, CONTACT_STATUSES, GENDERS, getSupportLevelDetails, getContactStatusDetails } from "@/lib/constants";

const updateSchema = z.object({
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
  supportLevel: z.enum(["strong", "leaning", "undecided", "opposed", "unknown"]),
  contactStatus: z.enum(["not_contacted", "contacted", "follow_up", "unreachable"]),
  notes: z.string().optional(),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export function VoterDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);

  const { data: voter, isLoading, error } = useGetVoter(id, { 
    query: { enabled: !!id && !isNaN(id), queryKey: getGetVoterQueryKey(id) } 
  });

  const updateVoter = useUpdateVoter();
  const deleteVoter = useDeleteVoter();
  
  const updateFnRef = useRef(updateVoter.mutate);
  const deleteFnRef = useRef(deleteVoter.mutate);

  useEffect(() => { updateFnRef.current = updateVoter.mutate; }, [updateVoter.mutate]);
  useEffect(() => { deleteFnRef.current = deleteVoter.mutate; }, [deleteVoter.mutate]);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
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

  // Sync form with loaded data when entering edit mode
  useEffect(() => {
    if (voter && isEditing) {
      form.reset({
        firstName: voter.firstName,
        lastName: voter.lastName,
        gender: voter.gender,
        phone: voter.phone || "",
        vin: voter.vin || "",
        dateOfBirth: voter.dateOfBirth ? voter.dateOfBirth.split('T')[0] : "",
        occupation: voter.occupation || "",
        lga: voter.lga,
        ward: voter.ward,
        pollingUnit: voter.pollingUnit,
        supportLevel: voter.supportLevel,
        contactStatus: voter.contactStatus,
        notes: voter.notes || "",
      });
    }
  }, [voter, isEditing, form]);

  if (!id || isNaN(id)) {
    return <div className="text-destructive">Invalid voter ID.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading voter record...</p>
        </div>
      </div>
    );
  }

  if (error || !voter) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Record Not Found</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          The voter record you are looking for does not exist or you don't have permission to view it.
        </p>
        <Link href="/admin/voters" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
          Return to Database
        </Link>
      </div>
    );
  }

  const support = getSupportLevelDetails(voter.supportLevel);
  const contact = getContactStatusDetails(voter.contactStatus);

  const onSubmit = (data: UpdateFormValues) => {
    const formattedData = {
      ...data,
      phone: data.phone || null,
      vin: data.vin || null,
      dateOfBirth: data.dateOfBirth || null,
      occupation: data.occupation || null,
      notes: data.notes || null,
    };

    updateFnRef.current({ id, data: formattedData }, {
      onSuccess: (updatedVoter) => {
        toast({
          title: "Record Updated",
          description: "Voter information has been saved successfully.",
        });
        setIsEditing(false);
        queryClient.setQueryData(getGetVoterQueryKey(id), updatedVoter);
        queryClient.invalidateQueries({ queryKey: getListVotersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
      },
      onError: (err: any) => {
        toast({
          title: "Update Failed",
          description: err?.response?.data?.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = () => {
    deleteFnRef.current({ id }, {
      onSuccess: () => {
        toast({
          title: "Record Deleted",
          description: "Voter has been removed from the database.",
        });
        queryClient.invalidateQueries({ queryKey: getListVotersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        setLocation("/admin/voters");
      },
      onError: (err: any) => {
        toast({
          title: "Deletion Failed",
          description: err?.response?.data?.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsEditing(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Voter Record</h1>
              <p className="text-muted-foreground text-sm">Update information for {voter.firstName} {voter.lastName}</p>
            </div>
          </div>
        </div>

        <Card className="border-border/50 shadow-md">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                        <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="occupation" render={({ field }) => (
                        <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="vin" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>VIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="lga" render={({ field }) => (
                        <FormItem>
                          <FormLabel>LGA</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {LGAS.map(lga => <SelectItem key={lga} value={lga}>{lga}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="ward" render={({ field }) => (
                        <FormItem><FormLabel>Ward</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="pollingUnit" render={({ field }) => (
                        <FormItem><FormLabel>Polling Unit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="supportLevel" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {SUPPORT_LEVELS.map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="contactStatus" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {CONTACT_STATUSES.map(status => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateVoter.isPending}>
                    {updateVoter.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View Mode
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/voters" className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-full" })}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {voter.firstName} {voter.lastName}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <span className="capitalize">{voter.gender}</span>
              <span className="h-1 w-1 rounded-full bg-border"></span>
              ID: {voter.id.toString().padStart(5, '0')}
              <span className="h-1 w-1 rounded-full bg-border"></span>
              Registered: {format(new Date(voter.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit2 className="h-4 w-4" /> Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the voter record for 
                  <span className="font-semibold text-foreground"> {voter.firstName} {voter.lastName} </span> 
                  from the Greater Bayelsa database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleteVoter.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Delete Record
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4" /> Phone Number
                  </dt>
                  <dd className="text-base text-foreground font-medium">{voter.phone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Briefcase className="h-4 w-4" /> Occupation
                  </dt>
                  <dd className="text-base text-foreground font-medium">{voter.occupation || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" /> Date of Birth
                  </dt>
                  <dd className="text-base text-foreground font-medium">
                    {voter.dateOfBirth ? format(new Date(voter.dateOfBirth), 'MMMM d, yyyy') : "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4" /> VIN
                  </dt>
                  <dd className="text-base text-foreground font-medium font-mono tracking-wider bg-muted px-2 py-1 rounded inline-block">
                    {voter.vin || "Not provided"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Electoral Location
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">LGA</dt>
                  <dd className="text-lg font-bold text-foreground">{voter.lga}</dd>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ward</dt>
                  <dd className="text-lg font-bold text-foreground">{voter.ward}</dd>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                  <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Polling Unit</dt>
                  <dd className="text-lg font-bold text-foreground">{voter.pollingUnit}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Outreach Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Support Level</h4>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${support.color}`}>
                  <div className="h-2 w-2 rounded-full bg-current"></div>
                  {support.label}
                </div>
              </div>
              <div className="h-px w-full bg-border/50"></div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact Status</h4>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${contact.color}`}>
                  <div className="h-2 w-2 rounded-full bg-current"></div>
                  {contact.label}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {voter.notes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-md border border-border/30">
                  {voter.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No additional notes recorded for this voter.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
