import { Request } from "express";

export function hasRole(req: Request, role: string) {
  const token: any = (req as any).auth || {};
  const roles: string[] = token?.realm_access?.roles || [];
  return roles.includes(role);
}