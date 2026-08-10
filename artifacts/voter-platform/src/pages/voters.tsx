import { useState } from "react";
import { useListVoters } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, Filter, Plus, ChevronRight, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { LGAS, SUPPORT_LEVELS, CONTACT_STATUSES, getSupportLevelDetails, getContactStatusDetails } from "@/lib/constants";

export function Voters() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState<string>("all");
  const [supportFilter, setSupportFilter] = useState<string>("all");
  const [contactFilter, setContactFilter] = useState<string>("all");

  // Simple debounce for search
  import("react").then(({ useEffect }) => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  });

  const queryParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(lgaFilter !== "all" ? { lga: lgaFilter } : {}),
    ...(supportFilter !== "all" ? { supportLevel: supportFilter } : {}),
    ...(contactFilter !== "all" ? { contactStatus: contactFilter } : {}),
  };

  const { data: voters, isLoading } = useListVoters(queryParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voter Database</h1>
          <p className="text-muted-foreground mt-1">Manage and filter all registered voters across Bayelsa.</p>
        </div>
        <Link href="/admin/register" className={buttonVariants({ className: "gap-2" })} data-testid="btn-add-voter">
          <Plus className="h-4 w-4" />
          Register Voter
        </Link>
      </div>

      <Card className="p-4 border-border/50 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search name, VIN, phone..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-voters"
            />
          </div>
          
          <Select value={lgaFilter} onValueChange={setLgaFilter}>
            <SelectTrigger data-testid="select-filter-lga">
              <SelectValue placeholder="All LGAs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All LGAs</SelectItem>
              {LGAS.map(lga => (
                <SelectItem key={lga} value={lga}>{lga}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={supportFilter} onValueChange={setSupportFilter}>
            <SelectTrigger data-testid="select-filter-support">
              <SelectValue placeholder="All Support Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Support Levels</SelectItem>
              {SUPPORT_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={contactFilter} onValueChange={setContactFilter}>
            <SelectTrigger data-testid="select-filter-contact">
              <SelectValue placeholder="All Contact Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contact Status</SelectItem>
              {CONTACT_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex h-[400px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading voter database...</p>
            </div>
          </div>
        ) : voters && voters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Name & Demographics</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Support Level</th>
                  <th className="px-6 py-4 font-medium">Contact Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="animate-in-stagger">
                {voters.map((voter) => {
                  const support = getSupportLevelDetails(voter.supportLevel);
                  const contact = getContactStatusDetails(voter.contactStatus);
                  return (
                    <tr key={voter.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">
                          {voter.firstName} {voter.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span className="capitalize">{voter.gender}</span>
                          {voter.phone && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-border"></span>
                              {voter.phone}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{voter.lga}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Ward: {voter.ward} <br/> PU: {voter.pollingUnit}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${support.color}`}>
                          {support.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${contact.color}`}>
                          {contact.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/voters/${voter.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 opacity-0 group-hover:opacity-100" data-testid={`btn-view-${voter.id}`}>
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">View {voter.firstName}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col h-[400px] w-full items-center justify-center text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No voters found</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              We couldn't find any voter records matching your current filters. Try adjusting your search criteria or register a new voter.
            </p>
            {Object.keys(queryParams).length > 0 && (
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setLgaFilter("all");
                  setSupportFilter("all");
                  setContactFilter("all");
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
