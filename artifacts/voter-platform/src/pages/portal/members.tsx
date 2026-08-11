import { useState } from "react";
import { useListMembers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, Shield, User, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Members() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const { data: members, isLoading } = useListMembers(
    {
      search: search || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined
    },
    { query: { queryKey: ["/api/members", search, roleFilter] } }
  );

  return (
    <div className="space-y-6 animate-in-stagger">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold font-serif tracking-tight">Member Directory</h1>
      </div>

      <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-12 bg-muted/50 border-transparent focus:bg-background">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="member">Members</SelectItem>
              <SelectItem value="unit_leader">Unit Leaders</SelectItem>
              <SelectItem value="secretary">Secretaries</SelectItem>
              <SelectItem value="treasurer">Treasurers</SelectItem>
              <SelectItem value="village_head">Village Heads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground font-bold text-xs uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Role & Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : members?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No members found matching your search.</p>
                  </td>
                </tr>
              ) : members?.map(member => (
                <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.photoUrl ? (
                        <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${member.photoUrl}`} className="w-10 h-10 rounded-lg object-cover bg-muted" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-foreground">{member.firstName} {member.lastName}</p>
                        <p className="text-xs font-mono text-muted-foreground">{member.membershipCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{member.phone}</p>
                    {member.whatsapp && <p className="text-xs text-emerald-600 font-medium mt-0.5">WhatsApp</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {member.villageName || "HQ"}
                    </p>
                    {member.unitName && <p className="text-xs text-muted-foreground mt-0.5">{member.unitName}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 items-start">
                      <Badge variant="outline" className={`font-bold uppercase tracking-wider text-[10px] ${
                        member.role === 'member' ? 'text-muted-foreground border-border' : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {member.role.replace('_', ' ')}
                      </Badge>
                      {member.status === 'active' ? (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center">
                          <Shield className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                          {member.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/members/${member.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "font-bold" })}>
                      View
                    </Link>
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
