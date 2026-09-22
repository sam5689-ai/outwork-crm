import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StageSelect } from "@/components/ui/stage-select";
import { CreateUserForm } from "@/components/settings/create-user-form";
import { updateUserRole, toggleUserActive } from "../actions";

export default async function UsersSettingsPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">
          Add a team member
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Create a login for a colleague. They can sign in with the username
          and temporary password below.
        </p>
        <CreateUserForm />
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {users.map((user) => {
                const updateRoleWithId = updateUserRole.bind(null, user.id);
                const toggleActiveWithId = toggleUserActive.bind(
                  null,
                  user.id
                );
                const isSelf = user.id === admin.id;
                return (
                  <tr key={user.id} className="hover:bg-neutral-50/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {user.name}
                      {isSelf && (
                        <Badge className="ml-2 bg-blue-50 text-blue-700">
                          You
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <StageSelect
                        action={updateRoleWithId}
                        name="role"
                        defaultValue={user.role}
                        options={[
                          { value: "USER", label: "User" },
                          { value: "ADMIN", label: "Admin" },
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StageSelect
                        action={toggleActiveWithId}
                        name="active"
                        defaultValue={user.active ? "true" : "false"}
                        options={[
                          { value: "true", label: "Active" },
                          { value: "false", label: "Inactive" },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
