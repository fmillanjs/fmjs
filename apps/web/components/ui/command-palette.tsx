'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Command } from 'cmdk';
import {
  Home,
  User,
  FolderKanban,
  FileText,
  Mail,
  LayoutDashboard,
  Briefcase,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full rounded-xl bg-background border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <Command.Input
          placeholder="Type a command or search..."
          className="w-full px-4 py-3 text-lg border-b bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {/* Portfolio Navigation */}
          <Command.Group
            heading="Portfolio Navigation"
            className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
          >
            <Command.Item
              onSelect={() => handleSelect(() => router.push('/'))}
              className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect(() => router.push('/about'))}
              className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
            >
              <User className="w-4 h-4" />
              <span>About</span>
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect(() => router.push('/projects'))}
              className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
            >
              <FolderKanban className="w-4 h-4" />
              <span>Projects</span>
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect(() => router.push('/resume'))}
              className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Resume</span>
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect(() => router.push('/contact'))}
              className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </Command.Item>
          </Command.Group>

          {/* TeamFlow */}
          <Command.Group
            heading="TeamFlow"
            className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase mt-2"
          >
            <Command.Item
              onSelect={() => handleSelect(() => router.push('/teams'))}
              className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Command.Item>
            <Command.Item
              onSelect={() =>
                handleSelect(() => router.push('/projects/teamflow'))
              }
              className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              <span>TeamFlow Case Study</span>
            </Command.Item>
          </Command.Group>

          {/* Quick Actions */}
          <Command.Group
            heading="Quick Actions"
            className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase mt-2"
          >
            <Command.Item
              onSelect={() => handleSelect(cycleTheme)}
              className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer hover:bg-accent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
              <span>Toggle Theme</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  );
}
