export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS = [
  { email: "demo@tasklocal.com", password: DEMO_PASSWORD, name: "Demo Operator" },
  { email: "manager@tasklocal.com", password: DEMO_PASSWORD, name: "Operations Manager" },
  { email: "support@tasklocal.com", password: DEMO_PASSWORD, name: "Support Specialist" },
  { email: "admin@tasklocal.com", password: DEMO_PASSWORD, name: "Admin User" },
];

// Real sign-up support: new accounts are saved in this browser's localStorage,
// so signing up actually creates a working account you can log back into --
// not a fake button. There's no backend yet, so this is per-browser, not
// shared across devices; that's the honest scope for a frontend demo.
const STORAGE_KEY = "tasklocal-registered-users";

function loadRegisteredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // localStorage unavailable (private mode, etc.) -- sign-up just won't persist
  }
}

export function authenticateDemoUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const allUsers = [...DEMO_USERS, ...loadRegisteredUsers()];
  return (
    allUsers.find(
      (user) => user.email === normalizedEmail && user.password === password
    ) || null
  );
}

// Returns the new user on success, or throws an Error with a message safe
// to show the visitor (e.g. "An account with this email already exists.").
export function registerUser(email, password, name) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const allUsers = [...DEMO_USERS, ...loadRegisteredUsers()];
  if (allUsers.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const newUser = {
    email: normalizedEmail,
    password,
    name: name?.trim() || normalizedEmail.split("@")[0],
  };

  const registered = loadRegisteredUsers();
  registered.push(newUser);
  saveRegisteredUsers(registered);

  return newUser;
}
