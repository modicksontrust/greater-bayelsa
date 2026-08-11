import { useState } from "react";
import { useListVoters, useImportVoters, useListVillages } from "@workspace/api-client-react";
import { Search, Database, Upload, FileUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AdminVoters() {
  const [search, setSearch] = useState("");
  const [villageFilter, setVillageFilter] = useState("all");

  const { data: villages } = useListVillages({ query: { queryKey: ["/api/villages"] } });
  
  const { data: voters, isLoading } = useListVoters(
    {
      search: search || undefined,
      villageId: villageFilter !== "all" ? parseInt(villageFilter) : undefined
    },
    { query: { queryKey: ["/api/voters", search, villageFilter] } }
  );

  return (
    <div className="space-y-6 animate-in-stagger pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight mb-2">Voter Database</h1>
          <p className="text-muted-foreground font-medium">Official INEC roll cross-reference.</p>
        </div>
        <ImportVotersDialog />
      </div>

      <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or VIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={villageFilter} onValueChange={setVillageFilter}>
            <SelectTrigger className="h-12 bg-muted/50 border-transparent focus:bg-background font-semibold">
              <SelectValue placeholder="All Villages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Villages</SelectItem>
              {villages?.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground font-bold text-xs uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Voter Name</th>
                <th className="px-6 py-4">VIN</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Demographics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [1,2,3,4,5,6].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : voters?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No voters found in the database.</p>
                  </td>
                </tr>
              ) : voters?.map(voter => (
                <tr key={voter.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-bold">{voter.firstName} {voter.lastName}</td>
                  <td className="px-6 py-4 font-mono text-xs">{voter.vin || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{voter.pollingUnit || 'Unknown PU'}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {voter.gender || '-'} • {voter.occupation || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ImportVotersDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const { toast } = useToast();

  const importMutation = useImportVoters({
    mutation: {
      onSuccess: (data) => {
        toast({ title: `Import complete`, description: `Imported ${data.imported} records. Skipped ${data.skipped}.` });
        setOpen(false);
        setFile(null);
      },
      onError: (err: any) => {
        toast({ title: "Import failed", description: err.response?.data?.error || "Unknown error", variant: "destructive" });
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        if (header && values[index]) {
          // simple mapping assumption
          if (header.includes('first')) row.firstName = values[index];
          if (header.includes('last')) row.lastName = values[index];
          if (header === 'vin') row.vin = values[index];
          if (header === 'gender') row.gender = values[index];
          if (header.includes('phone')) row.phone = values[index];
          if (header.includes('occupation')) row.occupation = values[index];
          if (header.includes('village')) row.villageName = values[index];
          if (header.includes('unit')) row.unitName = values[index];
          if (header.includes('dob') || header.includes('birth')) row.dateOfBirth = values[index];
        }
      });
      
      if (row.firstName && row.lastName) {
        rows.push(row as any);
      }
    }
    return rows;
  };

  const handleImport = async () => {
    if (!file) return;
    setParsing(true);
    
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast({ title: "Invalid CSV", description: "Could not extract valid records. Ensure headers like FirstName, LastName exist.", variant: "destructive" });
        setParsing(false);
        return;
      }
      
      // Limit to 1000 for client safety in this stub
      const chunk = rows.slice(0, 1000);
      importMutation.mutate({ data: { rows: chunk } });
      
    } catch (err) {
      toast({ title: "Parse error", description: "Failed to read file.", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-sm">
          <Upload className="w-4 h-4 mr-2" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-serif">Import Voter Roll</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-muted/20 relative group">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            <FileUp className="w-10 h-10 mx-auto mb-3 text-primary/50 group-hover:text-primary transition-colors" />
            <p className="font-bold mb-1">{file ? file.name : "Select CSV File"}</p>
            <p className="text-xs text-muted-foreground font-medium">Headers required: FirstName, LastName, VIN (optional)</p>
          </div>
          
          <Button 
            onClick={handleImport} 
            disabled={!file || parsing || importMutation.isPending} 
            className="w-full h-12 font-bold text-base shadow-sm"
          >
            {(parsing || importMutation.isPending) ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              "Import Records"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
