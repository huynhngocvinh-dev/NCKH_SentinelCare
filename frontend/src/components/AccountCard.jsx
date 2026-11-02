import { planBadge } from "../utils/subscriptionFormat";

const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-rose-500",
  "bg-violet-600",
  "bg-teal-600",
];

// Màu ảnh đại diện ổn định theo tên (cùng một người luôn cùng màu)
function colorFor(text = "") {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Avatar({ name, email, size = "md" }) {
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  const dimension =
    size === "lg"
      ? "w-20 h-20 text-3xl"
      : size === "sm"
      ? "w-9 h-9 text-sm"
      : "w-12 h-12 text-xl";

  return (
    <div
      className={`${dimension} rounded-full p-[3px] bg-gradient-to-tr from-blue-500 via-sky-400 to-violet-500 shrink-0`}
    >
      <div
        className={`w-full h-full rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white ${colorFor(
          name || email
        )}`}
      >
        {initial}
      </div>
    </div>
  );
}

export default function AccountCard({
  user,
  subscription,
  size = "md",
  className = "",
}) {
  const badge = planBadge(
    subscription?.planCode ?? "FREEMIUM",
    subscription?.planName
  );

  return (
    <div className={`flex items-center gap-4 min-w-0 ${className}`}>
      <Avatar name={user?.fullName} email={user?.email} size={size} />
      <div className="min-w-0">
        <p
          className={`font-semibold text-slate-900 truncate ${
            size === "lg" ? "text-xl" : "text-base"
          }`}
        >
          {user?.fullName || "Người dùng"}
        </p>
        <p className="text-sm text-slate-500 truncate">{user?.email}</p>
        <span
          className={`inline-block mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>
    </div>
  );
}
