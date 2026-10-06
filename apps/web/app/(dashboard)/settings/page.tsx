"use client";
import { API_URL } from "../../../lib/api";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import {
  User2,
  KeyRound,
  Bell,
  BrainCircuit,
  Palette,
  ShieldAlert,
  LogOut,
  Trash2,
  Check,
  Globe,
  GitFork,
  Mail,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { authClient } from "../../../lib/auth-client";
import { cachedFetch } from "../../../lib/cache";
import { Google } from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notifications {
  newMatches: boolean;
  deadlineReminders: boolean;
  savedUpdates: boolean;
  pursuingReminders: boolean;
  email: boolean;
}

interface Settings {
  matchingBreadth: "focused" | "balanced" | "broad";
  notifications: Notifications;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const SETTINGS_URL = `${API_URL}/api/settings`;

const BREADTH_OPTIONS: {
  value: Settings["matchingBreadth"];
  label: string;
  description: string;
}[] = [
  {
    value: "focused",
    label: "Focused",
    description:
      "Only opportunities that closely match your profile and preferences.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description:
      "A mix of strong matches and adjacent opportunities worth considering.",
  },
  {
    value: "broad",
    label: "Broad",
    description:
      "Cast a wider net — includes stretch opportunities and new directions.",
  },
];

const NOTIFICATION_ITEMS: {
  key: keyof Notifications;
  label: string;
  description: string;
}[] = [
  {
    key: "newMatches",
    label: "New opportunity matches",
    description:
      "When Arch surfaces new opportunities matched to your profile.",
  },
  {
    key: "deadlineReminders",
    label: "Deadline reminders",
    description:
      "Reminders before opportunities you've saved or are pursuing expire.",
  },
  {
    key: "savedUpdates",
    label: "Saved opportunity updates",
    description: "When saved opportunities change status or are updated.",
  },
  {
    key: "pursuingReminders",
    label: "Pursuing reminders",
    description: "Nudges on opportunities you're actively pursuing.",
  },
  {
    key: "email",
    label: "Email notifications",
    description: "Receive the above notifications by email as well as in-app.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="border border-border rounded-4xl p-6 bg-card space-y-5 animate-pulse">
      <div className="h-5 w-32 bg-muted rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-3 w-64 bg-muted rounded" />
          </div>
          <div className="h-6 w-10 bg-muted rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-foreground" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span
      className={`text-xs flex items-center gap-1 transition-opacity duration-300 ${
        status === "saved"
          ? "text-green-600 dark:text-green-400"
          : status === "error"
            ? "text-red-500"
            : "text-muted-foreground"
      }`}
    >
      {status === "saving" && <Loader2 size={12} className="animate-spin" />}
      {status === "saved" && <Check size={12} />}
      {status === "saving" && "Saving…"}
      {status === "saved" && "Saved"}
      {status === "error" && "Failed to save"}
    </span>
  );
}

function DeleteModal({
  onCancel,
  onConfirm,
  isDeleting,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const isConfirmed = confirmText === "delete my account";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-background border border-border rounded-4xl p-6 sm:p-8 w-full max-w-md shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full text-red-500 shrink-0">
              <AlertTriangle size={22} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-lg font-display font-medium text-foreground">
                Delete account
              </h2>
            </div>
          </div>
          {/* 
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full"
          >
            <X size={18} strokeWidth={1.5} />
          </button> */}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Deleting your account will permanently remove your profile, saved
          opportunities, application history, and all associated data. This
          action is <strong className="text-foreground">irreversible</strong>.
        </p>

        <div className="space-y-2 mb-6">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="confirm-delete-input"
          >
            Type{" "}
            <span className="font-medium text-foreground">
              delete my account
            </span>{" "}
            to confirm
          </label>
          <input
            id="confirm-delete-input"
            ref={inputRef}
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete my account"
            className="w-full px-4 py-3 text-sm bg-muted/50 border border-border rounded- outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all duration-200 placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm rounded-full border border-border text-foreground hover:bg-muted transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed || isDeleting}
            className="flex-1 px-4 py-2.5 text-sm rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            {isDeleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  id,
  icon,
  title,
  danger = false,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2
        id={id}
        className={`text-lg font-medium font-display ${
          danger ? "text-red-500" : "text-foreground"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">
        {value}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ChangePasswordModal({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      });
      if (res.error) {
        setError(res.error.message || "Failed to change password.");
        setIsSubmitting(false);
      } else {
        onSuccess();
      }
    } catch {
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-background border border-border rounded-4xl p-6 sm:p-8 w-full max-w-md shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground shrink-0">
              <KeyRound size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-lg font-display font-medium text-foreground">
                Change password
              </h2>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="currentPassword">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-muted/50 border border-border rounded-xl outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-200"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-muted/50 border border-border rounded-xl outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-200"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-muted/50 border border-border rounded-xl outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all duration-200"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm rounded-full border border-border text-foreground hover:bg-muted transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
              className="flex-1 px-4 py-2.5 text-sm rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Saving…" : "Save password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await cachedFetch<{ settings: Settings }>(SETTINGS_URL, {
          credentials: "include",
          ttl: 30_000,
        });
        if (!cancelled) setSettings(data.settings);
      } catch {
        if (!cancelled)
          setLoadError("Could not load settings. Please refresh.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function loadAccounts() {
      try {
        const res = await fetch(`${API_URL}/api/auth/list-accounts`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data)) {
            setConnectedProviders(
              data.map((a: { provider: string }) => a.provider),
            );
          }
        }
      } catch {
        /* non-critical */
      }
    }
    loadAccounts();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistSettings = useCallback((updated: Settings) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(SETTINGS_URL, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) throw new Error("server error");
        cachedFetch.invalidate(SETTINGS_URL);
        // matchingBreadth changes affect opportunity recommendations — flush
        // the home summary cache so the next visit reads updated matches, and
        // also flush all paginated opportunity list pages so Opportunities
        // reflects the updated breadth immediately on next navigation.
        cachedFetch.invalidate(`${API_URL}/api/opportunities/home`);
        cachedFetch.invalidatePrefix(`${API_URL}/api/opportunities?`);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    }, 600);
  }, []);

  const updateBreadth = (value: Settings["matchingBreadth"]) => {
    if (!settings) return;
    const updated = { ...settings, matchingBreadth: value };
    setSettings(updated);
    persistSettings(updated);
  };

  const updateNotification = (key: keyof Notifications, value: boolean) => {
    if (!settings) return;
    const updated = {
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    };
    setSettings(updated);
    persistSettings(updated);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.push("/signin");
      router.refresh();
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${SETTINGS_URL}/account`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("failed");
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const user = session?.user;
  const displayName = user?.name || "—";
  const displayEmail = user?.email || "—";

  const hasPasswordCredential =
    connectedProviders.includes("credential") ||
    (connectedProviders.length === 0 && !!session);

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          isDeleting={isDeleting}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          onCancel={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
            setPasswordSuccess(true);
            setTimeout(() => setPasswordSuccess(false), 3000);
          }}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
              Settings
            </h1>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>

        {loadError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle size={15} strokeWidth={1.5} />
            {loadError}
          </div>
        )}

        {/* Account */}
        <section aria-labelledby="section-account">
          <SectionHeader
            id="section-account"
            icon={<User2 size={16} strokeWidth={1.5} />}
            title="Account"
          />
          <div className="border border-border rounded-4xl bg-card overflow-hidden divide-y divide-border">
            <Row label="Name" value={displayName} />
            <Row label="Email" value={displayEmail} />
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">
                  Connected accounts
                </p>
                {passwordSuccess && (
                  <span className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <Check size={12} strokeWidth={2.5} />
                    Password updated successfully
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {hasPasswordCredential && (
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border text-foreground">
                        <Mail size={16} strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        Email and password
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-green-600 dark:text-green-500 hidden sm:flex items-center gap-1">
                        <Check size={12} strokeWidth={2.5} />
                        Connected
                      </span>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-foreground transition-colors"
                      >
                        Change password
                      </button>
                    </div>
                  </div>
                )}
                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                    connectedProviders.includes("google")
                      ? "border-border bg-muted/30"
                      : "border-border/40 bg-transparent opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border text-foreground">
                      <GoogleIcon fontSize="inherit" className="text-[16px]" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Google
                    </span>
                  </div>
                  <div className="text-xs font-medium">
                    {connectedProviders.includes("google") ? (
                      <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
                        <Check size={12} strokeWidth={2.5} />
                        Connected
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not connected</span>
                    )}
                  </div>
                </div>
                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                    connectedProviders.includes("github")
                      ? "border-border bg-muted/30"
                      : "border-border/40 bg-transparent opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border text-foreground">
                      <GitHubIcon fontSize="inherit" className="text-[16px]" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      GitHub
                    </span>
                  </div>
                  <div className="text-xs font-medium">
                    {connectedProviders.includes("github") ? (
                      <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
                        <Check size={12} strokeWidth={2.5} />
                        Connected
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not connected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {!hasPasswordCredential && (
              <div className="px-6 py-4 flex items-start gap-3">
                <KeyRound
                  size={15}
                  strokeWidth={1.5}
                  className="mt-0.5 text-muted-foreground shrink-0"
                />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Passwords and security are managed through your connected
                  authentication provider. To update your password, visit the
                  provider you signed in with.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* AI and Matching */}
        <section aria-labelledby="section-matching">
          <SectionHeader
            id="section-matching"
            icon={<BrainCircuit size={16} strokeWidth={1.5} />}
            title="AI and Matching"
          />
          {!settings && !loadError ? (
            <SectionSkeleton rows={1} />
          ) : (
            <div className="border border-border rounded-4xl bg-card p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Matching breadth
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Controls how aggressively Arch considers opportunities beyond
                  your core preferences.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BREADTH_OPTIONS.map((opt) => {
                  const active = settings?.matchingBreadth === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateBreadth(opt.value)}
                      className={`text-left p-4 rounded-2xl border transition-all duration-200 ${
                        active
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {opt.label}
                        </span>
                        {active && (
                          <span className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                            <Check
                              size={10}
                              strokeWidth={2.5}
                              className="text-background"
                            />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Notifications */}
        <section aria-labelledby="section-notifications">
          <SectionHeader
            id="section-notifications"
            icon={<Bell size={16} strokeWidth={1.5} />}
            title="Notifications"
          />
          {!settings && !loadError ? (
            <SectionSkeleton rows={5} />
          ) : (
            <div className="border border-border rounded-4xl bg-card overflow-hidden divide-y divide-border">
              {NOTIFICATION_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                  </div>
                  <Toggle
                    id={`notify-${item.key}`}
                    checked={settings?.notifications[item.key] ?? false}
                    onChange={(val) => updateNotification(item.key, val)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Appearance */}
        <section aria-labelledby="section-appearance">
          <SectionHeader
            id="section-appearance"
            icon={<Palette size={16} strokeWidth={1.5} />}
            title="Appearance"
          />
          <div className="border border-border rounded-4xl bg-card p-6">
            <p className="text-base font-medium text-foreground mb-1">Theme</p>
            {mounted ? (
              <div className="flex gap-2 flex-wrap">
                {[
                  {
                    value: "light" as const,
                    label: "Light",
                    icon: <Sun size={14} strokeWidth={1.5} />,
                  },
                  {
                    value: "dark" as const,
                    label: "Dark",
                    icon: <Moon size={14} strokeWidth={1.5} />,
                  },
                  {
                    value: "system" as const,
                    label: "System",
                    icon: <Monitor size={14} strokeWidth={1.5} />,
                  },
                ].map((opt) => {
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTheme(opt.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground/30 text-foreground"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-2">
                {[80, 68, 90].map((w, i) => (
                  <div
                    key={i}
                    className="h-9 bg-muted rounded-full animate-pulse"
                    style={{ width: w }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section aria-labelledby="section-danger">
          <SectionHeader
            id="section-danger"
            icon={<ShieldAlert size={16} strokeWidth={1.5} />}
            title="Danger zone"
            danger
          />
          <div className="border border-red-200 dark:border-red-900/50 rounded-4xl bg-card overflow-hidden divide-y divide-red-100 dark:divide-red-900/30">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-full border border-border text-foreground hover:bg-muted transition-colors duration-200 disabled:opacity-50 shrink-0"
              >
                {isSigningOut ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LogOut size={14} strokeWidth={1.5} />
                )}
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Delete account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-red-500/10 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors duration-200 shrink-0"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                Delete
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
