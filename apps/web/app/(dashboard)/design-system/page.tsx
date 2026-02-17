import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Design System</h1>
        <p className="text-muted-foreground mt-2">
          Shadcn UI components with Radix Colors. Toggle light/dark mode with the
          header button to verify dual-mode rendering.
        </p>
      </div>

      <Separator />

      {/* Button variants */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <Separator />

      {/* Card */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Project Alpha</CardTitle>
              <CardDescription>
                A card component with header and content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Card content text using muted-foreground token.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Project Beta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge>TypeScript</Badge>
                <Badge variant="secondary">React</Badge>
                <Badge variant="outline">Tailwind</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Input + Label */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Input + Label</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" type="text" placeholder="Fernando Millan" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="disabled">Disabled input</Label>
            <Input id="disabled" disabled placeholder="Cannot edit" />
          </div>
        </div>
      </section>

      <Separator />

      {/* Badge variants */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Badge</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <Separator />

      {/* Dialog */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm action</DialogTitle>
              <DialogDescription>
                This dialog uses Radix Colors with WCAG AA compliant text contrast.
                Toggle dark mode to verify both modes render correctly.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Confirm delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      <Separator />

      {/* Color token reference */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Color Tokens</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "background", bg: "bg-background", border: true },
            { name: "card", bg: "bg-card", border: true },
            { name: "primary", bg: "bg-primary" },
            { name: "secondary", bg: "bg-secondary", border: true },
            { name: "muted", bg: "bg-muted", border: true },
            { name: "accent", bg: "bg-accent", border: true },
            { name: "destructive", bg: "bg-destructive" },
            { name: "border", bg: "bg-border" },
          ].map(({ name, bg, border }) => (
            <div
              key={name}
              className={`h-16 rounded-md flex items-center justify-center text-xs font-medium ${bg} ${border ? "border border-border" : ""}`}
            >
              <span className="text-foreground mix-blend-difference">{name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
