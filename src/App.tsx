import { useEffect, useMemo, useState } from "react";
import { useKV } from "@github/spark/hooks";
import {
  BookOpen,
  CalendarDots,
  CaretRight,
  Clock,
  Fire,
  Flag,
  Lightning,
  List,
  MagnifyingGlass,
  MapPinLine,
  Moon,
  ShieldCheck,
  Sparkle,
  Sun,
  Sword,
  TrendUp,
  UserList,
} from "@phosphor-icons/react";

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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mirrorContent } from "@/data/mirror-content.generated";

type Theme = "light" | "dark";
type Guide = (typeof mirrorContent.guides)[number];
type CategoryId = (typeof mirrorContent.categories)[number]["id"];

const appTitle = "Commander Nexus";
const appSubtitle = "Mirror-backed Last War field manual";

const navigationLinks = [
  { label: "All Intel", href: "#all-intel", icon: BookOpen },
  { label: "Seasons", href: "#seasons", icon: CalendarDots },
  { label: "Heroes", href: "#heroes", icon: UserList },
  { label: "Events", href: "#events", icon: Fire },
  { label: "Tips", href: "#gameplay-tips", icon: Lightning },
  { label: "Progression", href: "#progression", icon: TrendUp },
  { label: "FAQ", href: "#faq", icon: Sparkle },
];

const categoryIcons: Record<CategoryId, typeof CalendarDots> = {
  seasons: CalendarDots,
  events: Fire,
  progression: TrendUp,
  systems: ShieldCheck,
};

function formatDate(value: string) {
  if (!value) return "Mirror archive";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function guideTimestamp(guide: Guide) {
  return new Date(guide.updatedAt || guide.publishedAt || "1970-01-01").getTime();
}

function guideSearchText(guide: Guide) {
  return [
    guide.title,
    guide.description,
    ...guide.tags,
    ...guide.highlights,
    ...guide.sections.map((section) => section.title),
    ...guide.sections.flatMap((section) => section.body),
  ]
    .join(" ")
    .toLowerCase();
}

function extractSeasonNumber(guide: Guide) {
  const text = `${guide.slug} ${guide.title}`;
  const match = text.match(/season[- ](\d+)/i);
  return match ? Number(match[1]) : null;
}

function isSeasonGuide(guide: Guide) {
  return extractSeasonNumber(guide) !== null;
}

function isPrimarySeasonGuide(guide: Guide) {
  if (!isSeasonGuide(guide)) return false;
  return !/week-\d+/i.test(guide.slug);
}

function isHeroGuide(guide: Guide) {
  return guide.slug === "heroes" || guide.slug === "heroes-teams" || /^heroes?[- ]/i.test(guide.slug);
}

function isGameplayTipGuide(guide: Guide) {
  const text = `${guide.slug} ${guide.title}`.toLowerCase();
  return (
    text.includes("tricks") ||
    text.includes("cheats") ||
    text.includes("best-strategy") ||
    text.includes("basics") ||
    text.includes("tips")
  );
}

function isEventGuide(guide: Guide) {
  return guide.category === "events";
}

function isProgressionGuide(guide: Guide) {
  if (guide.category === "progression") return true;
  const text = `${guide.slug} ${guide.title}`.toLowerCase();
  return text.includes("vip") || text.includes("buildings") || text.includes("daily-progress");
}

function sectionTag(guide: Guide) {
  if (isSeasonGuide(guide)) return "Season Intel";
  if (isHeroGuide(guide)) return "Heroes";
  if (isEventGuide(guide)) return "Events";
  if (isGameplayTipGuide(guide)) return "Gameplay Tips";
  if (isProgressionGuide(guide)) return "Progression";
  return "Systems";
}

function GuideCard({
  guide,
  active,
  label,
  onSelect,
}: {
  guide: Guide;
  active: boolean;
  label?: string;
  onSelect: (guideId: string) => void;
}) {
  const Icon = categoryIcons[guide.category];

  return (
    <Card
      className={`overflow-hidden border-border/70 transition hover:-translate-y-0.5 hover:shadow-lg ${
        active ? "ring-2 ring-accent/60" : ""
      }`}
    >
      <button type="button" onClick={() => onSelect(guide.id)} className="block w-full text-left">
        {guide.coverImage ? (
          <img src={guide.coverImage} alt={guide.title} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center bg-muted/40">
            <Icon size={36} className="text-muted-foreground" />
          </div>
        )}
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon size={16} />
              {label ?? sectionTag(guide)}
            </div>
            <span className="text-xs text-muted-foreground">{guide.readTimeMinutes} min</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold leading-snug">{guide.title}</h3>
            <p className="line-clamp-3 text-sm text-muted-foreground">{guide.description}</p>
          </div>
        </CardContent>
      </button>
    </Card>
  );
}

function App() {
  const [theme, setTheme] = useKV<Theme>("theme", "dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string>("season-6-lost-rainforest");
  const [selectedHeroId, setSelectedHeroId] = useState<string>(mirrorContent.heroIntel.heroes[0]?.id ?? "");

  const seasonGroups = useMemo(() => {
    const groups = new Map<number, Guide[]>();

    mirrorContent.guides
      .filter(isSeasonGuide)
      .sort((left, right) => guideTimestamp(right) - guideTimestamp(left))
      .forEach((guide) => {
        const seasonNumber = extractSeasonNumber(guide);
        if (seasonNumber === null) return;
        const current = groups.get(seasonNumber) ?? [];
        current.push(guide);
        groups.set(seasonNumber, current);
      });

    return Array.from(groups.entries())
      .sort((left, right) => right[0] - left[0])
      .map(([seasonNumber, guides]) => ({ seasonNumber, guides }));
  }, []);

  const [activeSeasonTab, setActiveSeasonTab] = useState<number>(seasonGroups[0]?.seasonNumber ?? 6);

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

  const searchResults = useMemo(() => {
    const loweredQuery = searchQuery.trim().toLowerCase();
    if (!loweredQuery) return mirrorContent.guides;

    return mirrorContent.guides.filter((guide) => guideSearchText(guide).includes(loweredQuery));
  }, [searchQuery]);

  const primarySeasonGuides = useMemo(
    () =>
      mirrorContent.guides
        .filter(isPrimarySeasonGuide)
        .sort((left, right) => {
          const leftSeason = extractSeasonNumber(left) ?? 0;
          const rightSeason = extractSeasonNumber(right) ?? 0;
          if (rightSeason !== leftSeason) return rightSeason - leftSeason;
          return guideTimestamp(right) - guideTimestamp(left);
        }),
    []
  );

  const heroGuides = useMemo(
    () => mirrorContent.guides.filter(isHeroGuide).sort((left, right) => guideTimestamp(right) - guideTimestamp(left)),
    []
  );
  const gearGuide = useMemo(() => mirrorContent.guides.find((guide) => guide.slug === "gears"), []);
  const selectedHero =
    mirrorContent.heroIntel.heroes.find((hero) => hero.id === selectedHeroId) ?? mirrorContent.heroIntel.heroes[0];

  const eventGuides = useMemo(
    () => mirrorContent.guides.filter(isEventGuide).sort((left, right) => guideTimestamp(right) - guideTimestamp(left)),
    []
  );

  const gameplayTipGuides = useMemo(
    () => mirrorContent.guides.filter(isGameplayTipGuide).sort((left, right) => guideTimestamp(right) - guideTimestamp(left)),
    []
  );

  const progressionGuides = useMemo(
    () => mirrorContent.guides.filter(isProgressionGuide).sort((left, right) => guideTimestamp(right) - guideTimestamp(left)),
    []
  );

  useEffect(() => {
    if (!mirrorContent.guides.some((guide) => guide.id === selectedGuideId)) {
      setSelectedGuideId(primarySeasonGuides[0]?.id ?? mirrorContent.guides[0]?.id ?? "");
    }
  }, [primarySeasonGuides, selectedGuideId]);

  const selectedGuide =
    mirrorContent.guides.find((guide) => guide.id === selectedGuideId) ?? primarySeasonGuides[0] ?? mirrorContent.guides[0];

  const activeSeasonGuides =
    seasonGroups.find((group) => group.seasonNumber === activeSeasonTab)?.guides ?? seasonGroups[0]?.guides ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        title="Search Commander Nexus"
        description="Search the mirrored Last War knowledge base."
      >
        <CommandInput
          placeholder="Search seasons, heroes, events, progression..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No mirrored guides matched that search.</CommandEmpty>
          <CommandGroup heading="Guides">
            {searchResults.slice(0, 16).map((guide) => (
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
                  <span className="text-muted-foreground text-xs">{sectionTag(guide)}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Sword weight="fill" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{appSubtitle}</p>
              <h1 className="text-lg font-semibold leading-none sm:text-xl">{appTitle}</h1>
            </div>
          </div>

          <nav className="hidden items-center gap-2 lg:flex">
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

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <List size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm">
                <SheetHeader>
                  <SheetTitle>{appTitle}</SheetTitle>
                  <SheetDescription>
                    Browse the mirror-backed Last War archive by seasons, heroes, events, tips, and FAQ.
                  </SheetDescription>
                </SheetHeader>

                <div className="grid gap-3 px-4">
                  <Button variant="outline" onClick={() => { setCommandOpen(true); setMobileMenuOpen(false); }}>
                    <MagnifyingGlass size={16} />
                    Search guides
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
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-card/80">
            <CardContent className="grid gap-6 p-0 md:grid-cols-[1.05fr_0.95fr]">
              <div className="flex flex-col justify-between gap-6 p-6 lg:p-8">
                <div className="space-y-4">
                  <Badge variant="secondary" className="w-fit">
                    Source of truth: `mirror/www.lastwartutorial.com`
                  </Badge>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{appTitle}</h2>
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                      A streamlined Last War intel hub built from the local mirror, with season tabs, hero references,
                      event timelines, gameplay tips, progression guides, and quick FAQ access.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="border-border/60 bg-background/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen size={16} />
                          Intel pages
                        </div>
                        <p className="mt-2 text-2xl font-semibold">{mirrorContent.stats.guideCount}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-background/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDots size={16} />
                          Seasons tracked
                        </div>
                        <p className="mt-2 text-2xl font-semibold">{seasonGroups.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-background/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserList size={16} />
                          Heroes tracked
                        </div>
                        <p className="mt-2 text-2xl font-semibold">{mirrorContent.heroIntel.heroes.length}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setCommandOpen(true)}>
                    <MagnifyingGlass size={18} />
                    Search the archive
                  </Button>
                  {selectedGuide ? (
                    <Button variant="outline" asChild>
                      <a href="#guide-detail" onClick={() => setSelectedGuideId(selectedGuide.id)}>
                        <CaretRight size={18} />
                        Open selected intel
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="relative min-h-72 overflow-hidden">
                {selectedGuide?.coverImage ? (
                  <img src={selectedGuide.coverImage} alt={selectedGuide.title} className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                {selectedGuide ? (
                  <div className="absolute inset-x-0 bottom-0 space-y-3 p-6">
                    <Badge className="bg-background/85 text-foreground shadow-sm">{sectionTag(selectedGuide)}</Badge>
                    <div>
                      <h3 className="max-w-lg text-2xl font-semibold">{selectedGuide.title}</h3>
                      <p className="mt-2 max-w-lg text-sm text-foreground/80">{selectedGuide.description}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Main menu</CardTitle>
              <CardDescription>
                The revised PRD menu structure, optimized for quick navigation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button key={link.href} asChild variant="outline" className="justify-start">
                    <a href={link.href}>
                      <Icon size={16} />
                      {link.label}
                    </a>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section id="all-intel" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">All Intel</h2>
            <p className="text-muted-foreground">
              Season-organized archive tabs built from the mirrored guide set.
            </p>
          </div>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Season tabs</CardTitle>
              <CardDescription>
                Switch across every season and inspect the linked mirrored pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {seasonGroups.map((group) => (
                  <Button
                    key={group.seasonNumber}
                    variant={activeSeasonTab === group.seasonNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveSeasonTab(group.seasonNumber)}
                  >
                    Season {group.seasonNumber}
                    <Badge variant="secondary" className="ml-1">{group.guides.length}</Badge>
                  </Button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeSeasonGuides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    active={guide.id === selectedGuide?.id}
                    label={`Season ${extractSeasonNumber(guide) ?? "?"}`}
                    onSelect={setSelectedGuideId}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="seasons" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">Seasons</h2>
            <p className="text-muted-foreground">
              Season mechanics, preseason overviews, and primary seasonal guides since inception.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {primarySeasonGuides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} active={guide.id === selectedGuide?.id} onSelect={setSelectedGuideId} />
            ))}
          </div>
        </section>

        <section id="heroes" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">Heroes</h2>
            <p className="text-muted-foreground">
              Mirror-backed hero roster with rarity, type, ability, skills, gear guidance, and hero imagery.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-border/70 lg:col-span-1">
              <CardHeader>
                <CardTitle>Hero system primer</CardTitle>
                <CardDescription>
                  The mirrored hero guide explains rarity, types, and ability roles before the individual roster.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview</h3>
                  <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                    {mirrorContent.heroIntel.overview.slice(0, 4).map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 size-1.5 rounded-full bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Hero types</h3>
                  <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                    {mirrorContent.heroIntel.typeGuide.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 size-1.5 rounded-full bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ability roles</h3>
                  <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                    {mirrorContent.heroIntel.abilityGuide.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 size-1.5 rounded-full bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {gearGuide ? (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Gear guide</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{gearGuide.description}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/70 lg:col-span-2">
              <CardHeader>
                <CardTitle>Hero roster</CardTitle>
                <CardDescription>
                  Every mirrored hero entry with the requested specs and skill breakdown.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {mirrorContent.heroIntel.heroes.map((hero) => (
                    <button
                      key={hero.id}
                      type="button"
                      onClick={() => setSelectedHeroId(hero.id)}
                      className={`overflow-hidden rounded-xl border text-left transition hover:border-accent/60 hover:bg-accent/5 ${
                        hero.id === selectedHero?.id ? "border-accent bg-accent/10" : "border-border/60"
                      }`}
                    >
                      {hero.image?.src ? (
                        <img src={hero.image.src} alt={hero.name} className="h-44 w-full object-cover" />
                      ) : null}
                      <div className="space-y-3 p-4">
                        <div>
                          <p className="font-semibold">{hero.name}</p>
                          <p className="text-sm text-muted-foreground">{hero.title}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{hero.rarity}</Badge>
                          <Badge variant="secondary">{hero.type}</Badge>
                          <Badge variant="secondary">{hero.ability}</Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedHero ? (
                  <div className="grid gap-5 rounded-2xl border border-border/60 bg-muted/20 p-4 md:grid-cols-[0.44fr_0.56fr]">
                    <div className="space-y-4">
                      {selectedHero.image?.src ? (
                        <img
                          src={selectedHero.image.src}
                          alt={selectedHero.name}
                          className="max-h-96 w-full rounded-xl border border-border/60 object-cover"
                        />
                      ) : null}
                      <div className="space-y-2">
                        <h3 className="text-2xl font-semibold">{selectedHero.name}</h3>
                        <p className="text-muted-foreground">{selectedHero.title}</p>
                        <p className="text-sm leading-7 text-muted-foreground">{selectedHero.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{selectedHero.rarity}</Badge>
                        <Badge variant="secondary">{selectedHero.type}</Badge>
                        <Badge variant="secondary">{selectedHero.ability}</Badge>
                      </div>

                      <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Gear</h4>
                          {selectedHero.gear.recommended.length > 0 ? (
                            <Badge variant="secondary">{selectedHero.gear.recommended.length} picks</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm leading-7 text-muted-foreground">{selectedHero.gear.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedHero.gear.recommended.length > 0 ? (
                            selectedHero.gear.recommended.map((item) => (
                              <Badge key={item} variant="outline">
                                {item}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">See general gears guide</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Skills</h4>
                        <Badge variant="secondary">{selectedHero.skills.length}</Badge>
                      </div>
                      <Accordion type="single" collapsible className="w-full">
                        {selectedHero.skills.map((skill) => (
                          <AccordionItem key={skill.name} value={skill.name}>
                            <AccordionTrigger>{skill.name}</AccordionTrigger>
                            <AccordionContent>
                              <p className="text-sm leading-7 text-muted-foreground">{skill.description}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {heroGuides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                active={guide.id === selectedGuide?.id}
                label="Hero guide"
                onSelect={setSelectedGuideId}
              />
            ))}
          </div>
        </section>

        <section id="events" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">Events</h2>
            <p className="text-muted-foreground">
              Event pages from the mirror sorted by the latest updated timeline first.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {eventGuides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} active={guide.id === selectedGuide?.id} onSelect={setSelectedGuideId} />
            ))}
          </div>
        </section>

        <section id="gameplay-tips" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">Gameplay Tips</h2>
            <p className="text-muted-foreground">
              Practical strategy, tricks, and beginner-friendly guidance pulled from the mirror.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {gameplayTipGuides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} active={guide.id === selectedGuide?.id} onSelect={setSelectedGuideId} />
            ))}
          </div>
        </section>

        <section id="progression" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold sm:text-3xl">Progression and Optimization</h2>
            <p className="text-muted-foreground">
              Base growth, VIP value, buildings, and long-term efficiency references.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {progressionGuides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} active={guide.id === selectedGuide?.id} onSelect={setSelectedGuideId} />
            ))}
          </div>
        </section>

        <section id="guide-detail" className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Search and jump</CardTitle>
              <CardDescription>
                Search specific intel directly or use the quick launcher.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search title, guide topic, hero, or season term"
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={() => setCommandOpen(true)}>
                  Quick search
                </Button>
              </div>

              <div className="grid gap-3">
                {searchResults.slice(0, 8).map((guide) => (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`rounded-xl border p-4 text-left transition hover:border-accent/60 hover:bg-accent/5 ${
                      guide.id === selectedGuide?.id ? "border-accent bg-accent/10" : "border-border/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium">{guide.title}</p>
                        <p className="text-sm text-muted-foreground">{sectionTag(guide)}</p>
                      </div>
                      <Badge variant="secondary">{guide.readTimeMinutes} min</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedGuide ? (
            <Card className="overflow-hidden border-border/70">
              <ScrollArea className="max-h-[82vh]">
                <div className="space-y-6">
                  {selectedGuide.coverImage ? (
                    <div className="relative h-72 overflow-hidden">
                      <img src={selectedGuide.coverImage} alt={selectedGuide.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-5">
                        <Badge>{sectionTag(selectedGuide)}</Badge>
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
                              <Flag weight="fill" className="mt-0.5 text-accent" size={18} />
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
                  </div>
                </div>
              </ScrollArea>
            </Card>
          ) : null}
        </section>

        <section id="faq" className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Frequently asked questions</CardTitle>
              <CardDescription>
                Quick answers based on mirrored guides and seasonal references.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>
                Use FAQ for quick orientation, then jump into the linked guide when you need the full breakdown,
                screenshots, and section-by-section detail.
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
                        <Button variant="outline" size="sm" onClick={() => setSelectedGuideId(faq.guideId)}>
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
      </main>
    </div>
  );
}

export default App;
