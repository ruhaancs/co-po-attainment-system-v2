"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export function UsersManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase.from("users").select("*").order("full_name");
    if (data) setUsers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateRole(id: string, role: UserRole) {
    await supabase.from("users").update({ role }).eq("id", id);
    load();
  }

  const roleVariant = (role: UserRole) => {
    if (role === "admin") return "default";
    if (role === "teacher") return "secondary";
    return "outline";
  };

  return (
    <div>
      <Header title="Users" description="Manage user roles across the system" />
      <Card className="glass-card">
        <CardContent className="p-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => updateRole(u.id, v as UserRole)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <Badge variant={roleVariant(u.role)}>{u.role}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="teacher">teacher</SelectItem>
                        <SelectItem value="student">student</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
