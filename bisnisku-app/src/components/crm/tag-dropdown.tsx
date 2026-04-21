"use client";

import { useState, useRef, useEffect } from "react";
import { useCrmStore, type TagItem } from "@/stores/crm-store";
import { BiIcon } from "@/components/ui/icons";
import { assignTag, createCustomerTag } from "@/lib/supabase/crm-actions";
import { useToast } from "@/components/ui/toast";

interface TagDropdownProps {
  customerId: string;
  assignedTagIds: string[];
  onTagAssigned: (tag: TagItem) => void;
}

export function TagDropdown({
  customerId,
  assignedTagIds,
  onTagAssigned,
}: TagDropdownProps) {
  const { tags, setTags } = useCrmStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const availableTags = tags.filter(
    (t) => !assignedTagIds.includes(t.id) && t.name.toLowerCase().includes(search.toLowerCase())
  );

  const showCreateOption =
    search.trim().length > 0 &&
    !tags.some((t) => t.name.toLowerCase() === search.toLowerCase());

  const handleAssign = async (tag: TagItem) => {
    try {
      await assignTag(customerId, tag.id);
      onTagAssigned(tag);
      setOpen(false);
      setSearch("");
    } catch {
      toast("error", "Gagal menambahkan tag");
    }
  };

  const handleCreate = async () => {
    if (!search.trim()) return;
    setCreating(true);
    try {
      // Pick a random nice color
      const colors = [
        "#3B82F6", "#8B5CF6", "#EC4899", "#10B981",
        "#F59E0B", "#EF4444", "#06B6D4", "#6366F1",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const newTag = await createCustomerTag({
        name: search.trim(),
        color,
      });
      // Update tags cache
      setTags([...tags, { ...newTag, is_auto: false, auto_rule: null }]);
      // Assign to customer
      await assignTag(customerId, newTag.id);
      onTagAssigned({ ...newTag, is_auto: false, auto_rule: null });
      toast("success", `Tag "${search.trim()}" dibuat dan ditambahkan`);
      setOpen(false);
      setSearch("");
    } catch {
      toast("error", "Gagal membuat tag baru");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-brand-primary hover:text-brand-dark inline-flex items-center gap-1"
      >
        <BiIcon name="plus" size="xs" /> Tag
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-white shadow-lg">
          {/* Search */}
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari atau buat tag..."
              className="w-full rounded-full border border-border px-2.5 py-1.5 text-xs outline-none focus:border-brand-primary"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-40 overflow-y-auto px-1 pb-1">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleAssign(tag)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            ))}

            {availableTags.length === 0 && !showCreateOption && (
              <p className="px-2.5 py-2 text-xs text-muted-foreground text-center">
                Semua tag sudah ditambahkan
              </p>
            )}

            {showCreateOption && (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-brand-dark hover:bg-brand-primary/10"
              >
                <BiIcon name="plus" size="xs" />
                Buat tag &quot;{search.trim()}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
