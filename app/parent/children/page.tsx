"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import type { Child, Grade, ChineseType } from "@/lib/types";

const GRADES: Grade[] = ["P3", "P4", "P5", "P6"];

const CHINESE_TYPES: { value: ChineseType; label: string; sublabel: string }[] = [
  { value: "Standard",   label: "华文",    sublabel: "Standard" },
  { value: "Higher",     label: "高级华文", sublabel: "Higher"   },
  { value: "Foundation", label: "基础华文", sublabel: "Foundation" },
];

const CHILD_COLORS = [
  { bg: "bg-amber-400", light: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", active: "bg-amber-400 text-white", inactive: "bg-amber-50 text-amber-700 border border-amber-200" },
  { bg: "bg-teal-500",  light: "bg-teal-50",  border: "border-teal-300",  text: "text-teal-700",  active: "bg-teal-500 text-white",  inactive: "bg-teal-50 text-teal-700 border border-teal-200"   },
  { bg: "bg-purple-400",light: "bg-purple-50",border: "border-purple-300",text: "text-purple-700",active: "bg-purple-400 text-white",inactive: "bg-purple-50 text-purple-700 border border-purple-200"},
];

const gradeEmoji: Record<string, string> = {
  P3: "🌱", P4: "🌿", P5: "🌳", P6: "🎓",
};

export default function ManageChildrenPage() {
  const router = useRouter();
  const { store, saveChildren } = useStore();
  const { user } = useAuth();
  const parentId = user?.id ?? "parent-1";

  // Always work with exactly 2 child slots
  const initial: Child[] = [0, 1].map((i) =>
    // Filter out any child-3 leftover from old data, then take by index
    store.children.filter((c) => c.id !== "child-3")[i] ?? {
      id: `child-${i + 1}`,
      name: "",
      grade: "P3" as Grade,
      chineseType: "Standard" as ChineseType,
      parentId,
    }
  );

  const [kids, setKids] = useState<Child[]>(initial);
  const [saved, setSaved] = useState(false);

  function update(index: number, field: keyof Child, value: string) {
    setKids((prev) =>
      prev.map((k, i) => (i === index ? { ...k, [field]: value } : k))
    );
    setSaved(false);
  }

  function handleSave() {
    // Enforce max 2 children — removes any child-3 still in localStorage
    saveChildren(kids.slice(0, 2));
    setSaved(true);
    setTimeout(() => router.push("/parent/dashboard"), 600);
  }

  return (
    <AppShell title="管理孩子资料 Children" backHref="/parent/dashboard">
      <div className="space-y-5 page-enter pb-28">

        <p className="text-sm text-gray-500">
          可设置两个孩子。修改后点击保存即可生效。<br />
          <span className="text-gray-400">Set up to two children. Changes take effect on save.</span>
        </p>

        {kids.map((child, i) => {
          const c = CHILD_COLORS[i];
          const isEmpty = !child.name.trim();

          return (
            <div key={child.id} className={`rounded-2xl border-2 ${c.border} overflow-hidden`}>
              {/* Header strip */}
              <div className={`${c.bg} px-4 py-3 flex items-center gap-2`}>
                <span className="text-xl">{gradeEmoji[child.grade] ?? "📚"}</span>
                <span className="font-black text-white text-base">
                  {isEmpty ? `孩子 ${i + 1}  Child ${i + 1}` : child.name}
                </span>
              </div>

              <div className={`${c.light} px-4 py-4 space-y-4`}>

                {/* Name */}
                <label className="block">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    姓名 Name
                  </span>
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    placeholder="例如：Xiao Ming"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 placeholder:text-gray-300"
                    style={{ "--tw-ring-color": c.bg.replace("bg-", "") } as React.CSSProperties}
                  />
                </label>

                {/* Grade */}
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    年级 Grade
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        onClick={() => update(i, "grade", g)}
                        className={[
                          "py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95",
                          child.grade === g ? c.active : c.inactive,
                        ].join(" ")}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chinese type */}
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    课程 Course
                  </span>
                  <div className="space-y-2">
                    {CHINESE_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        onClick={() => update(i, "chineseType", ct.value)}
                        className={[
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all active:scale-[0.98]",
                          child.chineseType === ct.value
                            ? `${c.active} shadow-sm`
                            : `bg-white border border-gray-200 ${c.text}`,
                        ].join(" ")}
                      >
                        <span className="font-bold text-sm">{ct.label}</span>
                        <span className={[
                          "text-xs",
                          child.chineseType === ct.value ? "text-white/80" : "text-gray-400",
                        ].join(" ")}>
                          {ct.sublabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 max-w-md mx-auto">
        <Button
          fullWidth size="lg"
          onClick={handleSave}
          variant={saved ? "secondary" : "primary"}
        >
          {saved ? "✓ 已保存！Saved!" : "保存 Save"}
        </Button>
      </div>
    </AppShell>
  );
}
