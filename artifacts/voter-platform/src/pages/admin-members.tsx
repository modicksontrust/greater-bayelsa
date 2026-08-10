import { useState, useRef, useEffect } from "react";
import { useListMembers, useAdminUpdateMember } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield, ChevronDown } from "lucide-react";
import { LGAS, MEMBER_ROLES, MEMBER_STATUSES, getRoleDetails, getStatusDetails } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AdminMembers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lgaFilter, setLgaFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMember = useAdminUpdateMember();
  const updateRef = useRef(updateMember.mutate);

  useEffect(() => { updateRef.current = updateMember.mutate; }, [updateMember.mutate]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(roleFilter !== "all" ? { role: roleFilter } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(lgaFilter !== "all" ? { lga: lgaFilter } : {}),
  };

  const { data: members, isLoading } = useListMembers(params);

  const handleUpdate = (id: number, data: any) => {
    updateRef.current({ id, data }, {
      onSuccess: () => {
        toast({ title: "Member Updated", description: "The member's profile has been updated." });
        queryClient.invalidateQueries({ queryKey: ["/api/members"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/members-summary"] });
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err?.response?.data?.error || "Error updating member.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Member Directory</h1>
        <p className="text-muted-foreground mt-1">Manage all registered members, roles, and status.</p>
      </div>

      <Card className="p-4 border-border/50 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, code, phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {MEMBER_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {MEMBER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={lgaFilter} onValueChange={setLgaFilter}>
            <SelectTrigger><SelectValue placeholder="All LGAs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All LGAs</SelectItem>
              {LGAS.map(lga => <SelectItem key={lga} value={lga}>{lga}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex h-[400px] w-full items-center justify-center">Loading members...</div>
        ) : members && members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const role = getRoleDetails(member.role);
                  const status = getStatusDetails(member.status);
                  return (
                    <tr key={member.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="font-bold font-serif text-foreground">{member.firstName} {member.lastName}</div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono">{member.membershipCode}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="text-foreground">{member.lga}</div>
                        <div className="text-xs">Ward {member.ward} • PU {member.pollingUnit}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs font-medium">
                          {member.role !== 'member' && <Shield className="h-3 w-3 text-primary" />}
                          {role.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1">Manage <ChevronDown className="h-3 w-3" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            {MEMBER_STATUSES.map(s => (
                              <DropdownMenuItem key={s.value} disabled={member.status === s.value} onClick={() => handleUpdate(member.id, { status: s.value })}>
                                Set {s.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Update Role</DropdownMenuLabel>
                            {MEMBER_ROLES.map(r => (
                              <DropdownMenuItem key={r.value} disabled={member.role === r.value} onClick={() => handleUpdate(member.id, { role: r.value })}>
                                Make {r.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">No members found.</div>
        )}
      </div>
    </div>
  );
}