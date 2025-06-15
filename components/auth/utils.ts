import { Role } from "@prisma/client";
import { Session } from "@/lib/auth";

export function hasAnyRole(user: Session['user'], roles?: Role[]) {
  if (!roles) return true;
  return roles.some((role) => user.role === role);
}