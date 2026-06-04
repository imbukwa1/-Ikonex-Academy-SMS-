import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navigationItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Class Streams", href: "/streams", icon: GraduationCap },
  { label: "Students", href: "/students", icon: UsersRound },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Academic Records", href: "/records", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: FileText },
];

export const utilityNavigationItems: NavItem[] = [
  { label: "Performance", href: "/dashboard", icon: BarChart3 },
];
