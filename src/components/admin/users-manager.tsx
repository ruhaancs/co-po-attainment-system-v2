"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/constants";
import { approveTeacher, deleteUser } from "@/app/auth/actions";
import type { Profile, Teacher, UserRole } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Check, X, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function UsersManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<(Teacher & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  async function load() {
    setLoading(true);
    const [uRes, tRes] = await Promise.all([
      supabase.from(TABLES.users).select("*").order("full_name"),
      supabase
        .from(TABLES.teachers)
        .select("*, profile:users(*)")
        .eq("approval_status", "pending"),
    ]);
    if (uRes.data) setUsers(uRes.data);
    if (tRes.data) setPendingTeachers(tRes.data as (Teacher & { profile?: Profile })[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  async function updateRole(id: string, role: UserRole) {
    const { error } = await supabase.from(TABLES.users).update({ role }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Role updated", variant: "success" });
      load();
    }
  }

  async function handleApproval(teacherId: string, approve: boolean) {
    const result = await approveTeacher(teacherId, approve);
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
    else {
      toast({ title: "Done", description: result.success, variant: "success" });
      load();
    }
  }

  async function handleDelete(profileId: string, label: string) {
    if (
      !confirm(
        `Permanently remove ${label}?\n\nThis deletes their login, profile, and teacher/student records. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(profileId);
    const result = await deleteUser(profileId);
    setDeletingId(null);

    if (result.error) {
      toast({ title: "Could not remove user", description: result.error, variant: "destructive" });
      return;
    }

    toast({ title: "User removed", description: result.success, variant: "success" });
    load();
  }

  return (
    <div>
      <Header
        title="User Management"
        description="Approve teachers, change roles, or permanently remove registered accounts"
      />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending teachers ({pendingTeachers.length})
          </TabsTrigger>
          <TabsTrigger value="all">All users</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Teacher approval queue</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {loading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTeachers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.profile?.full_name}</TableCell>
                        <TableCell>{t.profile?.email}</TableCell>
                        <TableCell>{t.employee_id}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" onClick={() => handleApproval(t.id, true)}>
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleApproval(t.id, false)}>
                            <X className="h-4 w-4" /> Reject
                          </Button>
                          {t.profile_id && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deletingId === t.profile_id}
                              onClick={() =>
                                handleDelete(
                                  t.profile_id,
                                  t.profile?.full_name ?? t.profile?.email ?? "this user"
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" /> Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingTeachers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No pending teacher registrations.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="glass-card">
            <CardContent className="p-0 pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(v) => updateRole(u.id, v as UserRole)}
                          disabled={u.id === currentUserId}
                        >
                          <SelectTrigger className="w-[130px]">
                            <Badge>{u.role}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="teacher">teacher</SelectItem>
                            <SelectItem value="student">student</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "success" : "warning"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {u.id === currentUserId ? (
                          <span className="text-xs text-muted-foreground">You</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingId === u.id}
                            onClick={() => handleDelete(u.id, u.full_name)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
