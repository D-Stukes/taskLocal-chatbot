export const DEMO_USERS = [
  { email: "demo@tasklocal.com", password: "demo1234", name: "Demo Operator" },
];

export function authenticateDemoUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  return DEMO_USERS.find(
    (user) => user.email === normalizedEmail && user.password === password
  ) || null;
}
