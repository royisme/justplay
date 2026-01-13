import { useLoaderData } from "react-router";
import { getEnv } from "@server/config/env";
import { getDb } from "@server/db/client";
import { user } from "@server/db/schema";
import { desc } from "drizzle-orm";
import type { Route } from "./+types/users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

export async function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const db = getDb(env);
  const users = await db.select().from(user).orderBy(desc(user.createdAt));
  return { users };
}

export default function UsersPage() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">查看和管理注册用户</p>
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.image || ""} />
                    <AvatarFallback>{u.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.createdAt?.toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
