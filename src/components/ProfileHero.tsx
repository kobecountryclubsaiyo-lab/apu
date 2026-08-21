import { accentClass } from "@/components/theme-icons";
import type { PublicUser } from "@/lib/serialize";

export default function ProfileHero({ user }: { user: PublicUser }) {
  return (
    <div className="px-6 pt-6 pb-5 bg-night text-paper">
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 font-heading text-night ${accentClass(user.avatarColor)}`}
        >
          {user.avatarInitial}
        </div>
        <div className="min-w-0">
          <p className="text-lg leading-tight truncate font-heading font-bold">{user.name}</p>
          {user.headline && (
            <p className="text-xs mt-1 leading-snug text-[#C9C3B4]">{user.headline}</p>
          )}
        </div>
      </div>
    </div>
  );
}
