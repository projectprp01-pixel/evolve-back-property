export type StaffRole = "Admin" | "Front Desk" | "Restaurant Manager" | "Spa Manager" | "Trainee";

export const STAFF_ROLES: StaffRole[] = [
  "Admin",
  "Front Desk",
  "Restaurant Manager",
  "Spa Manager",
  "Trainee",
];

export const SECTION_ROUTES: Record<string, string> = {
  "Home": "/",
  "Experience Hub": "/activities",
  "F&B Hub": "/fnb",
  "Spa Hub": "/spa",
  "Transport Hub": "/transport",
  "Comms Hub": "/comms",
  "Check-in Hub": "/checkin",
  "Guest Management": "/guests",
  "Analytics": "/analytics",
  "Staff Management": "/staff",
  "App Banners": "/assets",
  "Property Settings": "/settings",
};

export const ROLE_ACCESS: Record<StaffRole, string[]> = {
  Admin: [
    "Home", "Experience Hub", "F&B Hub", "Spa Hub", "Transport Hub",
    "Comms Hub", "Check-in Hub", "Guest Management",
    "Analytics", "Staff Management", "App Banners", "Property Settings",
  ],
  "Front Desk": [
    "Home", "Experience Hub", "F&B Hub", "Spa Hub", "Transport Hub",
    "Comms Hub", "Check-in Hub", "Guest Management", "App Banners",
  ],
  "Restaurant Manager": ["Home", "F&B Hub"],
  "Spa Manager": ["Home", "Spa Hub"],
  Trainee: [
    "Home", "Experience Hub", "F&B Hub", "Spa Hub", "Transport Hub",
    "Comms Hub", "Check-in Hub", "Guest Management", "App Banners", "Property Settings",
  ],
};

export const ROLE_CAN_WRITE: Record<StaffRole, boolean> = {
  Admin: true,
  "Front Desk": true,
  "Restaurant Manager": true,
  "Spa Manager": true,
  Trainee: false,
};
