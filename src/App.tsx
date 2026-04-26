import { useEffect, useMemo, useState } from "react";
import { useKV } from "@github/spark/hooks";
import {
  BookOpen,
  CalendarDots,
  CaretRight,
  CheckCircle,
  Clock,
  Fire,
  House,
  List,
  MagnifyingGlass,
  MapPinLine,
  Moon,
  NotePencil,
  ShieldCheck,
  Sparkle,
  Sun,
  Sword,
  TrendUp,
  Users,
} from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { mirrorContent } from "@/data/mirror-content.generated";

type Theme = "light" | "dark";
type Guide = (typeof mirrorContent.guides)[number];
type CategoryId = (typeof mirrorContent.categories)[number]["id"];
type FilterCategory = CategoryId | "all";

interface CommunityTip {
  id: string;
  title: string;
  category: CategoryId;
  content: string;
  author: string;
  relatedGuideId?: string;
  createdAt: number;
}

const categoryIcons: Record<CategoryId, typeof CalendarDots> = {
  seasons: CalendarDots,
  events: Fire,
  progression: TrendUp,
  systems: ShieldCheck,
};

const categoryAccent: Record<CategoryId, string> = {
  seasons: "from-emerald-500/20 via-emerald-400/10 to-transparent",
  events: "from-orange-500/20 via-amber-400/10 to-transparent",
  progression: "from-sky-500/20 via-blue-400/10 to-transparent",
  systems: "from-violet-500/20 via-fuchsia-400/10 to-transparent",
};

const navigationLinks = [
  { label: "Guides", href: "#guides", icon: BookOpen },
  { label: "FAQ", href: "#faq", icon: Sparkle },
  { label: "Community", href: "#community", icon: Users },
];

function formatDate(value: string) {
  if (!value) return "Mirror archive";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatCategory(category: CategoryId) {
  return mirrorContent.categories.find((item) => item.id === category)?.label ?? category;
}

function App() {
  const [theme, setTheme] = useKV<Theme>("theme", "dark");
  const [communityTips, setCommunityTips] = useKV<CommunityTip[]>("community-tips", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [selectedGuideId, setSelectedGuideId] = useState<string>(mirrorContent.featuredGuideIds[0] ?? mirrorContent.guides[0]?.id ?? "");
  const [tipForm, setTipForm] = useState({
    title: "",
    category: "seasons" as CategoryId,
    content: "",
    author: "",
    relatedGuideId: "",
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredGuides = useMemo(() => {
    const loweredQuery = searchQuery.trim().toLowerCase();

    return mirrorContent.guides.filter((guide) => {
      const categoryMatch = activeCategory === "all" || guide.category === activeCategory;
      if (!categoryMatch) return false;
      if (!loweredQuery) return true;

      const haystack = [
        guide.title,
        guide.description,
        ...guide.tags,
        ...guide.highlights,
        ...guide.sections.map((section) => section.title),
        ...guide.sections.flatMap((section) => section.body),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(loweredQuery);
    });
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    if (!filteredGuides.some((guide) => guide.id === selectedGuideId)) {
      setSelectedGuideId(filteredGuides[0]?.id ?? mirrorContent.guides[0]?.id ?? "");
    }
  }, [filteredGuides, selectedGuideId]);

  const selectedGuide = filteredGuides.find((guide) => guide.id === selectedGuideId) ?? mirrorContent.guides.find((guide) => guide.id === selectedGuideId) ?? filteredGuides[0];
  const featuredGuides = mirrorContent.featuredGuideIds
    .map((id) => mirrorContent.guides.find((guide) => guide.id === id))
    .filter(Boolean) as Guide[];

  const seasonalGuideCount = mirrorContent.guides.filter((guide) => guide.category === "seasons").length;
  const tipsForSelectedGuide = communityTips.filter((tip) => tip.relatedGuideId === selectedGuide?.id);

  const handleTipSubmit = () => {
    if (!tipForm.title.trim() || !tipForm.content.trim() || !tipForm.author.trim()) {
      toast.error("Please fill in the title, tip, and author fields.");
      return;
    }

    const nextTip: CommunityTip = {
      id: crypto.randomUUID(),
      title: tipForm.title.trim(),
      category: tipForm.category,
      content: tipForm.content.trim(),
      author: tipForm.author.trim(),
      relatedGuideId: tipForm.relatedGuideId || undefined,
      createdAt: Date.now(),
    };

    setCommunityTips([nextTip, ...communityTips]);
    setTipForm({
      title: "",
      category: "seasons",
      content: "",
      author: "",
      relatedGuideId: selectedGuide?.id ?? "",
    });
    setTipDialogOpen(false);
    toast.success("Community tip saved locally.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-right" />

      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        title="Search Last War guides"
        description="Search across the mirrored Last War guide archive."
      >
        <CommandInput
          placeholder="Search seasons, events, buildings, VIP, progression..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No mirrored guides matched that search.</CommandEmpty>
          <CommandGroup heading="Guides">
            {filteredGuides.slice(0, 12).map((guide) => (
              <CommandItem
                key={guide.id}
                value={`${guide.title} ${guide.description} ${guide.tags.join(" ")}`}
                onSelect={() => {
                  setSelectedGuideId(guide.id);
                  setCommandOpen(false);
                }}
              >
                <BookOpen />
                <span className="flex flex-col">
                  <span>{guide.title}</span>
                  <span className="text-muted-foreground text-xs">{formatCategory(guide.category)}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Share a community tip</DialogTitle>
            <DialogDescription>
              Save your own Last War tip locally so it becomes part of this guide board.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tip-title">Title</Label>
              <Input
                id="tip-title"
                value={tipForm.title}
                onChange={(event) => setTipForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Example: Best opening priorities for Season 6"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tip-category">Category</Label>
                <Select
                  value={tipForm.category}
                  onValueChange={(value) => setTipForm((current) => ({ ...current, category: value as CategoryId }))}
                >
                  <SelectTrigger id="tip-category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mirrorContent.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tip-author">Author</Label>
                <Input
                  id="tip-author"
                  value={tipForm.author}
                  onChange={(event) => setTipForm((current) => ({ ...current, author: event.target.value }))}
                  placeholder="Commander name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tip-guide">Related guide</Label>
              <Select
                value={tipForm.relatedGuideId || "none"}
                onValueChange={(value) =>
                  setTipForm((current) => ({
                    ...current,
                    relatedGuideId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger id="tip-guide" className="w-full">
                  <SelectValue placeholder="Attach to a mirrored guide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific guide</SelectItem>
                  {mirrorContent.guides.map((guide) => (
                    <SelectItem key={guide.id} value={guide.id}>
                      {guide.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tip-content">Tip</Label>
              <Textarea
                id="tip-content"
                rows={6}
                value={tipForm.content}
                onChange={(event) => setTipForm((current) => ({ ...current, content: event.target.value }))}
                placeholder="Share the tactic, timing, or build order that worked for you."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTipSubmit}>
              <NotePencil weight="fill" />
              Save tip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Sword weight="fill" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mirror-backed archive</p>
              <h1 className="text-lg font-semibold leading-none sm:text-xl">Last War Command Center</h1>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button key={link.href} asChild variant="ghost" size="sm">
                  <a href={link.href}>
                    <Icon size={16} />
                    {link.label}
                  </a>
                </Button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCommandOpen(true)} className="hidden sm:inline-flex">
              <MagnifyingGlass size={16} />
              Search
              <Badge variant="secondary" className="ml-1 hidden md:inline-flex">⌘K</Badge>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            <Button className="hidden sm:inline-flex" onClick={() => setTipDialogOpen(true)}>
              <NotePencil size={18} />
              Submit tip
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation">
                  <List size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm">
                <SheetHeader>
                  <SheetTitle>Navigate the archive</SheetTitle>
                  <SheetDescription>
                    Browse mirrored Last War guides, FAQs, and community tips.
                  </SheetDescription>
                </SheetHeader>

                <div className="grid gap-3 px-4">
                  <Button variant="outline" onClick={() => { setCommandOpen(true); setMobileMenuOpen(false); }}>
                    <MagnifyingGlass size={16} />
                    Search guides
                  </Button>
                  <Button onClick={() => { setTipDialogOpen(true); setMobileMenuOpen(false); }}>
                    <NotePencil size={16} />
                    Submit a tip
                  </Button>
                  {navigationLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Button key={link.href} asChild variant="ghost" className="justify-start">
                        <a href={link.href} onClick={() => setMobileMenuOpen(false)}>
                          <Icon size={16} />
                          {link.label}
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-card/80">
            <CardContent className="grid gap-6 p-0 md:grid-cols-[1.05fr_0.95fr]">
              <div className="flex flex-col justify-between gap-6 p-6 lg:p-8">
                <div className="space-y-4">
                  <Badge variant="secondary" className="w-fit">
                    Local mirror source: `mirror/www.lastwartutorial.com`
                  </Badge>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      {mirrorContent.site.title}
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                      {mirrorContent.site.description}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="border-border/60 bg-background/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen size={16} />
                          Guides
                        </div>
                        <p className="mt-2 text-2xl font-semibold">{mirrorContent.stats.guideCount}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-background/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDots size={16} />
                          Season pages
                        </div>
                        <p className="mt-2 text-2xl font-semibold">{seasonalGuideCount}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-background/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users size={16} />
                          Community tips
                        </div>
                        <p className="mt-2 text-2xl font-semibold">{communityTips.length}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setCommandOpen(true)}>
                    <MagnifyingGlass size={18} />
                    Search the mirror
                  </Button>
                  {selectedGuide && (
                    <Button variant="outline" asChild>
                      <a href="#guides" onClick={() => setSelectedGuideId(selectedGuide.id)}>
                        <CaretRight size={18} />
                        Open featured guide
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="relative min-h-72 overflow-hidden">
                {selectedGuide?.coverImage ? (
                  <img
                    src={selectedGuide.coverImage}
                    alt={selectedGuide.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : mirrorContent.site.coverImage ? (
                  <img
                    src={mirrorContent.site.coverImage}
                    alt="Last War Command Center"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
                {selectedGuide && (
                  <div className="absolute inset-x-0 bottom-0 space-y-3 p-6">
                    <Badge className="bg-background/85 text-foreground shadow-sm">{formatCategory(selectedGuide.category)}</Badge>
                    <div>
                      <h3 className="max-w-lg text-2xl font-semibold">{selectedGuide.title}</h3>
                      <p className="mt-2 max-w-lg text-sm text-foreground/80">{selectedGuide.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Featured from the mirror</CardTitle>
              <CardDescription>
                Jump straight into the most useful seasonal and progression guides.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredGuides.map((guide) => {
                const Icon = categoryIcons[guide.category];
                const isSelected = guide.id === selectedGuide?.id;

                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`w-full rounded-xl border p-4 text-left transition hover:border-accent/60 hover:bg-accent/5 ${
                      isSelected ? "border-accent bg-accent/10" : "border-border/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon size={16} />
                          {formatCategory(guide.category)}
                        </div>
                        <p className="font-semibold">{guide.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{guide.description}</p>
                      </div>
                      <Badge variant={isSelected ? "default" : "secondary"}>{guide.readTimeMinutes} min</Badge>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section id="guides" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Browse the guide library</CardTitle>
                <CardDescription>
                  Search and filter the mirrored Last War archive by focus area.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by guide title, topic, or keyword"
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setCommandOpen(true)}>
                    Quick search
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory("all")}
                  >
                    All guides
                  </Button>
                  {mirrorContent.categories.map((category) => {
                    const Icon = categoryIcons[category.id];
                    const count = mirrorContent.guides.filter((guide) => guide.category === category.id).length;

                    return (
                      <Button
                        key={category.id}
                        variant={activeCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory(category.id)}
                      >
                        <Icon size={16} />
                        {category.label}
                        <Badge variant="secondary" className="ml-1">{count}</Badge>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              {filteredGuides.map((guide) => {
                const Icon = categoryIcons[guide.category];
                const isSelected = guide.id === selectedGuide?.id;

                return (
                  <Card
                    key={guide.id}
                    className={`overflow-hidden border-border/70 transition hover:-translate-y-0.5 hover:shadow-lg ${
                      isSelected ? "ring-2 ring-accent/60" : ""
                    }`}
                  >
                    <button type="button" className="block w-full text-left" onClick={() => setSelectedGuideId(guide.id)}>
                      <div className={`h-1 w-full bg-gradient-to-r ${categoryAccent[guide.category]}`} />
                      {guide.coverImage ? (
                        <img src={guide.coverImage} alt={guide.title} className="h-44 w-full object-cover" />
                      ) : null}
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon size={16} />
                            {formatCategory(guide.category)}
                          </div>
                          <span className="text-xs text-muted-foreground">{guide.readTimeMinutes} min</span>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold leading-snug">{guide.title}</h3>
                          <p className="line-clamp-3 text-sm text-muted-foreground">{guide.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {guide.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="capitalize">
                              {tag.replaceAll("-", " ")}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </button>
                  </Card>
                );
              })}
            </div>

            {filteredGuides.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <MagnifyingGlass size={28} className="text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">No guides matched your filters.</p>
                    <p className="text-sm text-muted-foreground">
                      Try a broader keyword or reset to all guide categories.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
                    Reset filters
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            {selectedGuide ? (
              <Card className="overflow-hidden border-border/70">
                <ScrollArea className="max-h-[80vh]">
                  <div className="space-y-6">
                    {selectedGuide.coverImage ? (
                      <div className="relative h-72 overflow-hidden">
                        <img src={selectedGuide.coverImage} alt={selectedGuide.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-5">
                          <Badge>{formatCategory(selectedGuide.category)}</Badge>
                          <Badge variant="secondary">{selectedGuide.readTimeMinutes} min read</Badge>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-6 p-5 pt-0">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={16} />
                            Updated {formatDate(selectedGuide.updatedAt || selectedGuide.publishedAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPinLine size={16} />
                            {selectedGuide.sourcePath}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">{selectedGuide.title}</h2>
                          <p className="text-base leading-7 text-muted-foreground">{selectedGuide.description}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {selectedGuide.highlights.map((highlight) => (
                          <Card key={highlight} className="border-border/60 bg-background/70">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <CheckCircle weight="fill" className="mt-0.5 text-accent" size={18} />
                                <p className="text-sm leading-6">{highlight}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Guide breakdown</h3>
                          <Badge variant="secondary">{selectedGuide.sections.length} sections</Badge>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                          {selectedGuide.sections.map((section) => (
                            <AccordionItem key={section.id} value={section.id}>
                              <AccordionTrigger>{section.title}</AccordionTrigger>
                              <AccordionContent className="space-y-4">
                                {section.image?.src ? (
                                  <img
                                    src={section.image.src}
                                    alt={section.image.alt}
                                    className="max-h-72 w-full rounded-xl border border-border/60 object-cover"
                                  />
                                ) : null}
                                {section.body.map((paragraph) => (
                                  <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                                    {paragraph}
                                  </p>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>

                      {selectedGuide.gallery.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Mirrored images</h3>
                            <Badge variant="secondary">{selectedGuide.gallery.length} assets</Badge>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {selectedGuide.gallery.slice(0, 6).map((image) => (
                              <figure key={`${image.src}-${image.alt}`} className="overflow-hidden rounded-xl border border-border/60">
                                <img src={image.src} alt={image.alt} className="h-44 w-full object-cover" />
                                <figcaption className="border-t border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                  {image.alt}
                                </figcaption>
                              </figure>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">Community notes for this guide</h3>
                            <p className="text-sm text-muted-foreground">
                              Save local commander notes and strategies alongside the mirrored reference.
                            </p>
                          </div>
                          <Button variant="outline" onClick={() => {
                            setTipForm((current) => ({ ...current, relatedGuideId: selectedGuide.id, category: selectedGuide.category }));
                            setTipDialogOpen(true);
                          }}>
                            <NotePencil size={16} />
                            Add note
                          </Button>
                        </div>
                        {tipsForSelectedGuide.length > 0 ? (
                          <div className="space-y-3">
                            {tipsForSelectedGuide.map((tip) => (
                              <Card key={tip.id} className="border-border/60 bg-background/80">
                                <CardContent className="space-y-2 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium">{tip.title}</p>
                                    <Badge variant="secondary">{formatDate(new Date(tip.createdAt).toISOString())}</Badge>
                                  </div>
                                  <p className="text-sm leading-6 text-muted-foreground">{tip.content}</p>
                                  <p className="text-xs text-muted-foreground">Submitted by {tip.author}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No local commander notes yet for this guide.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </Card>
            ) : null}
          </div>
        </section>

        <section id="faq" className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Frequently asked questions</CardTitle>
              <CardDescription>
                Quick answers derived from the mirrored guide archive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>
                These answers are intentionally short so players can get oriented fast on mobile and then jump into the related guide.
              </p>
              <p>
                Use the search or featured guides when you want the full seasonal breakdown, screenshots, and mirrored section details.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {mirrorContent.faqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                      {faq.guideId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGuideId(faq.guideId)}
                        >
                          <CaretRight size={16} />
                          Open related guide
                        </Button>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section id="community" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Community tips board</CardTitle>
              <CardDescription>
                Keep your own Last War notes alongside the mirror-backed reference library.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                <p className="text-sm leading-7 text-muted-foreground">
                  Tip submissions are stored locally in the app and can be tied to a specific mirrored guide or kept as a general strategy note.
                </p>
              </div>
              <Button onClick={() => setTipDialogOpen(true)}>
                <NotePencil size={18} />
                Submit a new tip
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {communityTips.length > 0 ? (
              communityTips.map((tip) => {
                const Icon = categoryIcons[tip.category];
                const relatedGuide = mirrorContent.guides.find((guide) => guide.id === tip.relatedGuideId);

                return (
                  <Card key={tip.id} className="border-border/70">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary" className="inline-flex items-center gap-1">
                          <Icon size={14} />
                          {formatCategory(tip.category)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(new Date(tip.createdAt).toISOString())}</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{tip.title}</h3>
                        <p className="text-sm leading-7 text-muted-foreground">{tip.content}</p>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Shared by {tip.author}</p>
                        {relatedGuide ? <p>Attached to: {relatedGuide.title}</p> : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-dashed border-border/70 md:col-span-2">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <House size={28} className="text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium">No community tips saved yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Be the first to add a tactic, event prep note, or build order.
                    </p>
                  </div>
                  <Button onClick={() => setTipDialogOpen(true)}>
                    <NotePencil size={16} />
                    Add the first tip
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
