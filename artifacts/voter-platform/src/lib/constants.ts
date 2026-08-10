export const LGAS = [
  "Brass",
  "Ekeremor",
  "Kolokuma/Opokuma",
  "Nembe",
  "Ogbia",
  "Sagbama",
  "Southern Ijaw",
  "Yenagoa"
] as const;

export const SUPPORT_LEVELS = [
  { value: "strong", label: "Strong Supporter", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "leaning", label: "Leaning", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "undecided", label: "Undecided", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "opposed", label: "Opposed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  { value: "unknown", label: "Unknown", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" }
] as const;

export const CONTACT_STATUSES = [
  { value: "not_contacted", label: "Not Contacted", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  { value: "contacted", label: "Contacted", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "follow_up", label: "Follow Up", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "unreachable", label: "Unreachable", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" }
] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" }
] as const;

export const MEMBER_ROLES = [
  { value: "member", label: "Member" },
  { value: "unit_coordinator", label: "Unit Coordinator" },
  { value: "ward_coordinator", label: "Ward Coordinator" },
  { value: "lga_coordinator", label: "LGA Coordinator" },
  { value: "admin", label: "Admin" }
] as const;

export const MEMBER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-800" },
  { value: "active", label: "Active", color: "bg-emerald-100 text-emerald-800" },
  { value: "suspended", label: "Suspended", color: "bg-red-100 text-red-800" }
] as const;

export const MEMBERSHIP_CATEGORIES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" }
] as const;

export function getSupportLevelDetails(level: string) {
  return SUPPORT_LEVELS.find(l => l.value === level) || SUPPORT_LEVELS[4];
}

export function getContactStatusDetails(status: string) {
  return CONTACT_STATUSES.find(s => s.value === status) || CONTACT_STATUSES[0];
}

export function getRoleDetails(role: string) {
  return MEMBER_ROLES.find(r => r.value === role) || MEMBER_ROLES[0];
}

export function getStatusDetails(status: string) {
  return MEMBER_STATUSES.find(s => s.value === status) || MEMBER_STATUSES[0];
}