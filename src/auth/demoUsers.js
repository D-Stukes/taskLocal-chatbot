export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS = [
  { email: "demo@tasklocal.com", password: DEMO_PASSWORD, name: "Demo Operator" },
  { email: "manager@tasklocal.com", password: DEMO_PASSWORD, name: "Operations Manager" },
  { email: "support@tasklocal.com", password: DEMO_PASSWORD, name: "Support Specialist" },
  { email: "admin@tasklocal.com", password: DEMO_PASSWORD, name: "Admin User" },
];

export function authenticateDemoUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  return DEMO_USERS.find(
    (user) => user.email === normalizedEmail && user.password === password
  ) || null;
}
