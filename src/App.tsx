import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { 
  Sun, 
  Moon, 
  MagnifyingGlass, 
  List, 
  X, 
  Sword, 
  Shield, 
  ChartLine, 
  Trophy, 
  CalendarDots, 
  Users, 
  PencilSimple,
  CheckCircle,
  Crosshair,
  Flag,
  Target,
  Lightning,
  Star,
  Heart,
  Flame,
  Skull,
  FirstAid,
  Gauge,
  Sneaker,
  UserCircle,
  ArrowUp,
  ArrowDown,
  Sparkle
} from '@phosphor-icons/react'

type Category = 'combat' | 'defense' | 'strategy' | 'events' | 'resources' | 'community'
type Theme = 'light' | 'dark'
type HeroRarity = 'common' | 'rare' | 'epic' | 'legendary'
type HeroRole = 'tank' | 'damage' | 'support' | 'specialist'

interface Guide {
  id: string
  title: string
  category: Category
  content: string
  tags: string[]
}

interface UserTip {
  id: string
  category: Category
  title: string
  content: string
  author: string
  submittedAt: number
}

interface FAQ {
  question: string
  answer: string
}

interface HeroAbility {
  name: string
  description: string
  cooldown?: number
  type: 'active' | 'passive'
}

interface HeroStats {
  attack: number
  defense: number
  hp: number
  speed: number
}

interface Hero {
  id: string
  name: string
  rarity: HeroRarity
  role: HeroRole
  stats: HeroStats
  abilities: HeroAbility[]
  description: string
  strengths: string[]
  weaknesses: string[]
  bestWith: string[]
  tacticalTips: string[]
}

function App() {
  const [theme, setTheme] = useKV<Theme>('theme', 'dark')
  const [userTips, setUserTips] = useKV<UserTip[]>('user-tips', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const guides: Guide[] = [
    {
      id: '1',
      title: 'Understanding Season Mechanics',
      category: 'strategy',
      content: 'Last War operates on seasonal cycles that reset progress while retaining certain achievements. Each season typically lasts 60-90 days and introduces new units, events, and challenges. Key season mechanics include: Season Pass rewards, ranked leaderboards, exclusive season units, and progressive difficulty scaling. Plan your resource allocation early in the season to maximize benefits.',
      tags: ['season', 'mechanics', 'planning']
    },
    {
      id: '2',
      title: 'Essential Combat Strategies',
      category: 'combat',
      content: 'Combat in Last War requires understanding unit counters, terrain advantages, and timing. Infantry counters cavalry, cavalry counters ranged, and ranged counters infantry. Always scout enemy formations before engaging. Use terrain to your advantage - high ground provides attack bonuses. Combine different unit types for balanced armies. Time your special abilities carefully during battles.',
      tags: ['combat', 'units', 'tactics']
    },
    {
      id: '3',
      title: 'Resource Management Guide',
      category: 'resources',
      content: 'Efficient resource management is crucial for progression. Focus on upgrading resource buildings first: farms for food, lumber mills for wood, mines for ore, and refineries for fuel. Join an active alliance for resource sharing. Complete daily missions for consistent resource income. Use speed-ups wisely during critical upgrades. Save gems for permanent upgrades rather than temporary boosts.',
      tags: ['resources', 'economy', 'buildings']
    },
    {
      id: '4',
      title: 'Event Optimization',
      category: 'events',
      content: 'Events provide massive rewards if approached strategically. Save resources before major events to complete objectives quickly. Focus on events that reward your current needs. Alliance events require coordination - communicate with members. Limited-time events often have the best rewards. Complete event chains fully for bonus multipliers.',
      tags: ['events', 'rewards', 'planning']
    },
    {
      id: '5',
      title: 'Defensive Base Building',
      category: 'defense',
      content: 'A strong defense deters attacks and protects resources. Place your headquarters in the center surrounded by defensive structures. Upgrade walls consistently. Position traps near common attack paths. Keep a garrison of troops ready. Activate shields during vulnerable periods. Join a powerful alliance for reinforcement support.',
      tags: ['defense', 'base', 'protection']
    },
    {
      id: '6',
      title: 'Alliance Benefits and Cooperation',
      category: 'community',
      content: 'Alliances are essential for success in Last War. Benefits include: construction and research help (reduces time by up to 10 hours), resource sharing, coordinated attacks on world bosses, alliance buffs, and territory control. Be active in alliance events, donate regularly, and communicate with members. Choose an alliance that matches your activity level.',
      tags: ['alliance', 'cooperation', 'benefits']
    },
    {
      id: '7',
      title: 'Hero Development Path',
      category: 'strategy',
      content: 'Heroes provide significant combat bonuses. Prioritize leveling your main combat heroes first. Focus on one hero per role (tank, damage, support) initially. Hero skills should match your army composition. Epic and legendary heroes offer better long-term value. Use hero experience items during events for bonus multipliers.',
      tags: ['heroes', 'progression', 'combat']
    },
    {
      id: '8',
      title: 'Daily Task Optimization',
      category: 'strategy',
      content: 'Complete all daily tasks for consistent progression. Priority order: VIP point tasks, resource gathering, building upgrades, research, and training troops. Daily login rewards accumulate - missing days resets progress. Complete the daily quest chain for bonus chests. Use auto-complete for routine tasks when available.',
      tags: ['daily', 'tasks', 'efficiency']
    },
    {
      id: '9',
      title: 'Advanced Troop Composition',
      category: 'combat',
      content: 'Optimal army composition varies by situation. For balanced armies, use 40% infantry, 30% cavalry, 30% ranged. For speed attacks, use cavalry-heavy compositions. For sieges, include siege units. Against specific enemies, counter their main unit type. Higher-tier troops are significantly more effective but cost more resources.',
      tags: ['troops', 'army', 'composition']
    },
    {
      id: '10',
      title: 'PvP Combat Tips',
      category: 'combat',
      content: 'Player versus player combat requires preparation. Scout targets thoroughly before attacking. Attack during off-peak hours when players are offline. Use march presets for quick deployment. Send multiple waves against strong targets. Rally attacks with alliance members for tough opponents. Always leave some troops home for defense.',
      tags: ['pvp', 'combat', 'tactics']
    },
    {
      id: '11',
      title: 'Season Pass Value Analysis',
      category: 'events',
      content: 'The Season Pass offers significant value if completed. Free track provides basic rewards, premium track multiplies rewards substantially. Complete daily and weekly missions to progress quickly. Premium pass typically pays for itself by level 20. Best purchased early in season for maximum benefit. Save currency if you cannot complete the pass.',
      tags: ['season', 'pass', 'value']
    },
    {
      id: '12',
      title: 'Research Priority Guide',
      category: 'strategy',
      content: 'Research provides permanent bonuses. Priority order: Economic research (resource production and building speed), Military research (troop stats and capacity), Defense research (base protection). Complete one research branch at a time for efficiency. Use research speed-ups during alliance events. Higher academy levels unlock crucial late-game research.',
      tags: ['research', 'upgrades', 'progression']
    }
  ]

  const faqs: FAQ[] = [
    {
      question: 'How long does a season last?',
      answer: 'A typical season in Last War lasts between 60-90 days. The exact duration is announced at the start of each season. Check the in-game season timer for precise countdown.'
    },
    {
      question: 'What happens to my progress when a season ends?',
      answer: 'Most progress carries over between seasons including: base level, building levels, research, and VIP level. Season-specific items like season pass rewards and ranked positions reset. You keep all resources and troops.'
    },
    {
      question: 'How do I join an alliance?',
      answer: 'Tap the Alliance button in the main menu, then browse available alliances or search by name/tag. Apply to join and wait for acceptance. New player alliances are recommended for beginners.'
    },
    {
      question: 'What are the best troops for beginners?',
      answer: 'Focus on balanced tier-appropriate troops. Early game: basic infantry and ranged units are most cost-effective. Upgrade to tier 2 troops as soon as possible. Avoid training too many tier 1 troops beyond early game.'
    },
    {
      question: 'How can I protect my resources?',
      answer: 'Use resources immediately for upgrades to keep stockpiles low. Activate protection shields before logging off with large resources. Store excess resources in alliance warehouse. Upgrade storehouse for increased protection capacity.'
    },
    {
      question: 'Should I spend gems on resources?',
      answer: 'Generally no. Gems are better spent on: permanent building slots, VIP points, and special events. Resources regenerate naturally and can be gathered from the world map.'
    },
    {
      question: 'How important is VIP level?',
      answer: 'VIP level is extremely important for long-term progression. Higher VIP provides: construction queue slots, research speed bonuses, resource production bonuses, and more daily rewards. Focus on reaching VIP 6-8 early.'
    },
    {
      question: 'What are the best events to focus on?',
      answer: 'Priority events: Resource gathering events (easy rewards), Building upgrade events (align with your plans), and Alliance events (coordinate with members). Limited-time special events usually have the best unique rewards.'
    },
    {
      question: 'How do I counter different troop types?',
      answer: 'Infantry beats cavalry, cavalry beats ranged, ranged beats infantry. Scout enemy compositions and adjust your army accordingly. Mixed armies are safer against unknown enemies.'
    },
    {
      question: 'When should I use speed-ups?',
      answer: 'Use speed-ups strategically: during time-limited events, to complete critical upgrades before going offline, or for coordinated alliance activities. Avoid using them on short timers that complete naturally.'
    },
    {
      question: 'How do world bosses work?',
      answer: 'World bosses spawn periodically and require alliance coordination. Damage dealt by all alliance members accumulates. Rewards are distributed based on contribution. Use appropriate troop types and hero skills for maximum damage.'
    },
    {
      question: 'What buildings should I prioritize upgrading?',
      answer: 'Priority order: Headquarters (unlocks everything), Resource buildings (steady income), Academy (research), Barracks (troop capacity), Hospital (saves wounded troops). Keep all buildings near HQ level for efficiency.'
    },
    {
      question: 'How does the rally system work?',
      answer: 'Rallies allow multiple alliance members to attack a single target together. The rally leader starts the rally with a timer. Members join before timer expires. Coordinate in alliance chat for best results.'
    },
    {
      question: 'What are hero skills and when should I upgrade them?',
      answer: 'Hero skills provide combat bonuses and special abilities. Upgrade skills that match your playstyle. Combat skills boost army performance, while economic skills help resource production. Focus on your main heroes first.'
    },
    {
      question: 'Is it worth spending real money?',
      answer: 'Last War can be played free-to-play successfully. If spending, best value: monthly card (daily rewards), season pass (if completing), and special limited offers. Avoid random loot boxes and pure resource purchases.'
    }
  ]

  const heroes: Hero[] = [
    {
      id: '1',
      name: 'Commander Marcus',
      rarity: 'legendary',
      role: 'tank',
      stats: {
        attack: 850,
        defense: 1250,
        hp: 8500,
        speed: 65
      },
      abilities: [
        {
          name: 'Fortified Defense',
          description: 'Increases all allied troops defense by 25% for 10 seconds. During this time, Marcus takes 40% reduced damage.',
          cooldown: 45,
          type: 'active'
        },
        {
          name: 'Shield Wall',
          description: 'When HP drops below 50%, automatically activates a shield absorbing 2000 damage for 8 seconds.',
          type: 'passive'
        },
        {
          name: 'Tactical Commander',
          description: 'All infantry units under his command gain +15% HP and +10% defense.',
          type: 'passive'
        }
      ],
      description: 'A veteran commander known for his defensive prowess and ability to hold strategic positions against overwhelming odds.',
      strengths: ['Exceptional durability', 'Strong defensive buffs', 'Great for sieges', 'Protects allied troops'],
      weaknesses: ['Low mobility', 'Moderate damage output', 'Vulnerable to sustained ranged attacks'],
      bestWith: ['Elena Frost (for balanced offense/defense)', 'Infantry-heavy armies', 'Defensive formations'],
      tacticalTips: [
        'Position Marcus at the front line to absorb damage while ranged units deal damage from behind',
        'Use Fortified Defense when facing burst damage or artillery strikes',
        'Pair with healing support heroes to maximize his survivability',
        'Best deployed in chokepoints and defensive scenarios'
      ]
    },
    {
      id: '2',
      name: 'Elena Frost',
      rarity: 'legendary',
      role: 'damage',
      stats: {
        attack: 1450,
        defense: 720,
        hp: 5200,
        speed: 95
      },
      abilities: [
        {
          name: 'Arctic Strike',
          description: 'Deals 350% attack damage to a single target and slows their movement speed by 60% for 5 seconds.',
          cooldown: 35,
          type: 'active'
        },
        {
          name: 'Freezing Aura',
          description: 'Enemies within range have their attack speed reduced by 20%. This effect stacks with other slow effects.',
          type: 'passive'
        },
        {
          name: 'Critical Precision',
          description: 'Increases critical hit chance by 25% and critical damage by 40%.',
          type: 'passive'
        }
      ],
      description: 'An elite sniper specialist who excels at eliminating high-value targets and controlling enemy movement with devastating precision.',
      strengths: ['Highest single-target damage', 'Excellent mobility', 'Strong crowd control', 'Great for assassinating enemy heroes'],
      weaknesses: ['Low HP pool', 'Vulnerable in close combat', 'Requires good positioning'],
      bestWith: ['Commander Marcus (provides protection)', 'Ranged unit compositions', 'Flanking strategies'],
      tacticalTips: [
        'Always keep Elena at maximum range to maximize damage while minimizing risk',
        'Use Arctic Strike on enemy damage dealers or heroes first',
        'Position her behind tanks or on elevated terrain for protection',
        'Extremely effective against slow-moving tank heroes',
        'Save Arctic Strike for crucial moments rather than spamming on cooldown'
      ]
    },
    {
      id: '3',
      name: 'Dr. Sarah Chen',
      rarity: 'epic',
      role: 'support',
      stats: {
        attack: 620,
        defense: 880,
        hp: 6100,
        speed: 75
      },
      abilities: [
        {
          name: 'Mass Regeneration',
          description: 'Heals all allied troops for 15% of their max HP and grants health regeneration of 2% per second for 10 seconds.',
          cooldown: 55,
          type: 'active'
        },
        {
          name: 'Medical Expertise',
          description: 'Reduces wounded troop casualties by 30%. More troops survive battles and can be healed at the hospital.',
          type: 'passive'
        },
        {
          name: 'Combat Medic',
          description: 'Allies within range receive continuous healing of 1% HP per second.',
          type: 'passive'
        }
      ],
      description: 'A brilliant field medic whose advanced medical technology keeps armies fighting longer and reduces casualties significantly.',
      strengths: ['Outstanding healing capabilities', 'Reduces troop losses', 'Sustained support', 'Great for long battles'],
      weaknesses: ['Low damage output', 'Requires protection', 'Minimal crowd control'],
      bestWith: ['Commander Marcus (synergizes with high HP)', 'Tank-heavy compositions', 'Extended sieges'],
      tacticalTips: [
        'Dr. Chen is essential for resource-efficient warfare as she dramatically reduces troop losses',
        'Keep her in the middle of your formation, protected by tanks',
        'Use Mass Regeneration right after enemies use their burst damage abilities',
        'Invaluable for PvP and siege situations where preserving troops matters',
        'Her passive makes her worthwhile even if she doesn\'t survive the battle'
      ]
    },
    {
      id: '4',
      name: 'Viktor "The Wolf" Kozlov',
      rarity: 'legendary',
      role: 'specialist',
      stats: {
        attack: 1280,
        defense: 950,
        hp: 6800,
        speed: 110
      },
      abilities: [
        {
          name: 'Guerrilla Assault',
          description: 'Teleports behind enemy lines, dealing 280% attack damage to all nearby enemies and increasing movement speed by 50% for 8 seconds.',
          cooldown: 40,
          type: 'active'
        },
        {
          name: 'Pack Hunter',
          description: 'Damage increases by 8% for each enemy hero present, up to 32% with 4 enemy heroes.',
          type: 'passive'
        },
        {
          name: 'Evasive Maneuvers',
          description: 'Has a 30% chance to dodge incoming attacks completely. This chance increases to 50% when below 40% HP.',
          type: 'passive'
        }
      ],
      description: 'A master of guerrilla warfare who strikes from unexpected angles and thrives in chaotic multi-hero battles.',
      strengths: ['Extreme mobility', 'Excels in multi-hero fights', 'Unpredictable', 'Great for disruption'],
      weaknesses: ['Requires skill to master', 'Risky playstyle', 'Less effective against single targets'],
      bestWith: ['Fast cavalry units', 'Hit-and-run tactics', 'Flanking maneuvers'],
      tacticalTips: [
        'Viktor excels at disrupting enemy backlines - use him to target healers and ranged damage dealers',
        'Save Guerrilla Assault for critical moments when you need to eliminate a priority target',
        'Most effective in battles with multiple enemy heroes due to Pack Hunter',
        'His high mobility makes him perfect for raid attacks and quick strikes',
        'Use hit-and-run tactics to maximize his evasion passive'
      ]
    },
    {
      id: '5',
      name: 'Captain Isabella Rodriguez',
      rarity: 'epic',
      role: 'damage',
      stats: {
        attack: 1180,
        defense: 780,
        hp: 5600,
        speed: 85
      },
      abilities: [
        {
          name: 'Artillery Barrage',
          description: 'Calls in an artillery strike on target area, dealing 220% attack damage to all enemies in a large radius. Burns the ground, dealing additional damage over 6 seconds.',
          cooldown: 50,
          type: 'active'
        },
        {
          name: 'Tactical Bombardment',
          description: 'All ranged attacks have a 25% chance to deal splash damage to nearby enemies for 50% of the damage dealt.',
          type: 'passive'
        },
        {
          name: 'Fire Support',
          description: 'Increases attack range of all allied ranged units by 20%.',
          type: 'passive'
        }
      ],
      description: 'An artillery specialist who brings devastating area-of-effect damage to the battlefield, perfect for breaking enemy formations.',
      strengths: ['Excellent AoE damage', 'Strong against grouped enemies', 'Good range', 'Synergizes with ranged units'],
      weaknesses: ['Vulnerable to fast attackers', 'Long ability cooldown', 'Less effective against spread formations'],
      bestWith: ['Ranged-heavy armies', 'Elena Frost (double ranged power)', 'Siege scenarios'],
      tacticalTips: [
        'Artillery Barrage is devastating against tightly grouped enemy formations',
        'Use her increased range buff to kite melee-heavy enemy armies',
        'Extremely effective in siege defense where enemies cluster at chokepoints',
        'Pair with slow/freeze effects to keep enemies in the artillery strike zone',
        'Position her safely behind your front line to maximize her damage output'
      ]
    },
    {
      id: '6',
      name: 'Sergeant James "Bull" Turner',
      rarity: 'rare',
      role: 'tank',
      stats: {
        attack: 720,
        defense: 1050,
        hp: 7200,
        speed: 60
      },
      abilities: [
        {
          name: 'Defensive Stance',
          description: 'Increases defense by 50% and taunts nearby enemies to attack him for 8 seconds. During this time, damage taken is reduced by 30%.',
          cooldown: 50,
          type: 'active'
        },
        {
          name: 'Stubborn Resilience',
          description: 'Cannot be killed for 3 seconds after reaching 1 HP. This effect has a 90 second cooldown.',
          type: 'passive'
        },
        {
          name: 'Infantry Training',
          description: 'Infantry units under his command gain +12% defense.',
          type: 'passive'
        }
      ],
      description: 'A tough-as-nails sergeant who refuses to go down and protects his troops with unwavering determination.',
      strengths: ['Great survivability', 'Reliable tank option', 'Easy to obtain', 'Good for beginners'],
      weaknesses: ['Limited utility', 'Low damage', 'Basic abilities compared to legendary tanks'],
      bestWith: ['Infantry armies', 'New players', 'Budget-friendly compositions'],
      tacticalTips: [
        'Excellent starter tank hero that remains useful throughout early and mid-game',
        'Use Defensive Stance when enemies focus fire on him to maximize damage absorption',
        'His survivability passive can turn the tide of close battles',
        'Cost-effective alternative to legendary tanks for F2P players',
        'Pair with damage dealers who can capitalize on the time Bull buys them'
      ]
    },
    {
      id: '7',
      name: 'Phantom',
      rarity: 'legendary',
      role: 'specialist',
      stats: {
        attack: 1350,
        defense: 650,
        hp: 4800,
        speed: 125
      },
      abilities: [
        {
          name: 'Shadow Strike',
          description: 'Becomes invisible for 6 seconds, then strikes dealing 400% attack damage. If this kills the target, cooldown is reduced by 50%.',
          cooldown: 38,
          type: 'active'
        },
        {
          name: 'Assassin\'s Mark',
          description: 'Marks the enemy hero with lowest HP. Deals 30% increased damage to marked targets.',
          type: 'passive'
        },
        {
          name: 'Shadow Veil',
          description: 'Has a 40% chance to avoid all damage from the first attack after not being attacked for 5 seconds.',
          type: 'passive'
        }
      ],
      description: 'A mysterious assassin who specializes in eliminating weakened targets and operating in the shadows.',
      strengths: ['Ultimate hero killer', 'Highest mobility', 'Stealth mechanics', 'Snowball potential with resets'],
      weaknesses: ['Lowest HP in game', 'Requires perfect timing', 'Ineffective if focused'],
      bestWith: ['AoE damage dealers who weaken multiple targets', 'Fast strike teams', 'Cleanup strategies'],
      tacticalTips: [
        'Phantom is designed for cleaning up damaged enemies - let allies damage targets first',
        'The cooldown reset mechanic can create devastating chain kills in the right situation',
        'Most effective when enemies are already engaged with your main army',
        'Extremely high skill cap - not recommended for beginners',
        'Use invisibility to reposition or escape, not just for damage'
      ]
    },
    {
      id: '8',
      name: 'Major Liu Wei',
      rarity: 'epic',
      role: 'support',
      stats: {
        attack: 780,
        defense: 920,
        hp: 6400,
        speed: 70
      },
      abilities: [
        {
          name: 'Tactical Orders',
          description: 'All allied units gain +35% attack and +25% attack speed for 12 seconds.',
          cooldown: 60,
          type: 'active'
        },
        {
          name: 'Battle Coordination',
          description: 'Increases troop march speed by 15% and reduces training time by 10%.',
          type: 'passive'
        },
        {
          name: 'Strategic Mind',
          description: 'Allied heroes gain +10% to all stats when fighting alongside Major Liu.',
          type: 'passive'
        }
      ],
      description: 'A brilliant strategist whose tactical acumen enhances all friendly forces on the battlefield.',
      strengths: ['Powerful offensive buffs', 'Boosts all allies', 'March speed bonus', 'Versatile support'],
      weaknesses: ['No healing', 'Requires allies to be effective', 'Moderate survivability'],
      bestWith: ['Damage-focused heroes', 'Mixed army compositions', 'Aggressive strategies'],
      tacticalTips: [
        'Major Liu turns good armies into great ones with his massive buff potential',
        'Use Tactical Orders at the start of engagements for maximum impact',
        'His march speed bonus makes him valuable for both PvE and PvP scenarios',
        'Pairs exceptionally well with Elena Frost to create devastating burst damage',
        'Essential for speed-running events and timed challenges'
      ]
    }
  ]

  const rarityConfig = {
    common: { color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: 'Common' },
    rare: { color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Rare' },
    epic: { color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Epic' },
    legendary: { color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Legendary' }
  }

  const roleConfig = {
    tank: { icon: Shield, color: 'text-blue-500', label: 'Tank' },
    damage: { icon: Sword, color: 'text-red-500', label: 'Damage' },
    support: { icon: Heart, color: 'text-green-500', label: 'Support' },
    specialist: { icon: Sparkle, color: 'text-purple-500', label: 'Specialist' }
  }

  const categoryConfig = {
    combat: { icon: Sword, label: 'Combat', color: 'text-red-500' },
    defense: { icon: Shield, label: 'Defense', color: 'text-blue-500' },
    strategy: { icon: ChartLine, label: 'Strategy', color: 'text-purple-500' },
    events: { icon: CalendarDots, label: 'Events', color: 'text-orange-500' },
    resources: { icon: Trophy, label: 'Resources', color: 'text-yellow-500' },
    community: { icon: Users, label: 'Community', color: 'text-green-500' }
  }

  const filterContent = (items: Guide[]) => {
    let filtered = items

    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }

  const filterTips = (tips: UserTip[] | undefined) => {
    if (!tips) return []
    
    let filtered = tips

    if (activeCategory !== 'all') {
      filtered = filtered.filter(tip => tip.category === activeCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tip => 
        tip.title.toLowerCase().includes(query) ||
        tip.content.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const filterHeroes = (heroList: Hero[]) => {
    let filtered = heroList

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(hero => 
        hero.name.toLowerCase().includes(query) ||
        hero.description.toLowerCase().includes(query) ||
        hero.role.toLowerCase().includes(query) ||
        hero.rarity.toLowerCase().includes(query) ||
        hero.abilities.some(ability => 
          ability.name.toLowerCase().includes(query) ||
          ability.description.toLowerCase().includes(query)
        )
      )
    }

    return filtered
  }

  const handleSubmitTip = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const category = formData.get('category') as Category
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const author = formData.get('author') as string

    if (!category || !title || !content || !author) {
      toast.error('Please fill in all fields')
      return
    }

    const newTip: UserTip = {
      id: Date.now().toString(),
      category,
      title,
      content,
      author,
      submittedAt: Date.now()
    }

    setUserTips((currentTips) => [newTip, ...(currentTips || [])])
    toast.success('Tip submitted successfully!', {
      icon: <CheckCircle className="text-green-500" weight="fill" />
    })
    setDialogOpen(false)
    e.currentTarget.reset()
  }

  const filteredGuides = filterContent(guides)
  const filteredTips = filterTips(userTips)
  const filteredHeroes = filterHeroes(heroes)

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Target weight="fill" className="text-accent-foreground" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Command Center</h2>
            <p className="text-xs text-muted-foreground">Last War Guide</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          <Button
            variant={activeCategory === 'all' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              setActiveCategory('all')
              setMobileMenuOpen(false)
            }}
          >
            <Flag weight="fill" className="mr-3" size={20} />
            All Content
          </Button>

          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
          </div>

          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={key}
                variant={activeCategory === key ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveCategory(key as Category)
                  setMobileMenuOpen(false)
                }}
              >
                <Icon weight="fill" className={`mr-3 ${config.color}`} size={20} />
                {config.label}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <NavContent />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Lightning weight="fill" className="text-accent" size={28} />
              <h1 className="text-xl font-bold hidden sm:block">Last War Command Center</h1>
              <h1 className="text-lg font-bold sm:hidden">Command Center</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-72 border-r border-border sticky top-16 h-[calc(100vh-4rem)]">
          <NavContent />
        </aside>

        <main className="flex-1">
          <div className="pattern-dots py-12 px-4 md:px-8 border-b border-border">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Crosshair weight="bold" className="text-accent" size={40} />
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Master Last War</h2>
                  <p className="text-muted-foreground text-lg">Strategic guides, seasonal mechanics, and community wisdom</p>
                </div>
              </div>

              <div className="relative mt-6">
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search guides, tips, and strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>

              <div className="flex gap-2 mt-4 justify-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <PencilSimple weight="fill" size={18} />
                      Submit a Tip
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Share Your Strategy</DialogTitle>
                      <DialogDescription>
                        Help the community by sharing your gameplay tips and strategies
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitTip} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="author">Your Name</Label>
                        <Input id="author" name="author" placeholder="Commander name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" required>
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Tip Title</Label>
                        <Input id="title" name="title" placeholder="Quick and descriptive title" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">Tip Content</Label>
                        <Textarea 
                          id="content" 
                          name="content" 
                          placeholder="Share your strategy in detail..." 
                          rows={6}
                          required 
                        />
                      </div>
                      <Button type="submit" className="w-full">Submit Tip</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
            <Tabs defaultValue="guides" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="guides">Official Guides</TabsTrigger>
                <TabsTrigger value="heroes">Heroes</TabsTrigger>
                <TabsTrigger value="community">Community Tips</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
              </TabsList>

              <TabsContent value="guides" className="space-y-6">
                {filteredGuides.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MagnifyingGlass size={48} className="text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">No guides found</p>
                      <p className="text-muted-foreground text-center">Try adjusting your search or browse all categories</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredGuides.map((guide) => {
                      const config = categoryConfig[guide.category]
                      const Icon = config.icon
                      return (
                        <Card key={guide.id} className="transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <Icon weight="fill" className={`${config.color}`} size={32} />
                              <Badge variant="secondary">{config.label}</Badge>
                            </div>
                            <CardTitle className="text-xl">{guide.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground mb-4 line-clamp-4">{guide.content}</p>
                            <div className="flex flex-wrap gap-2">
                              {guide.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="heroes" className="space-y-6">
                {filteredHeroes.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <UserCircle size={48} className="text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">No heroes found</p>
                      <p className="text-muted-foreground text-center">Try adjusting your search</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {filteredHeroes.map((hero) => {
                      const rarityStyle = rarityConfig[hero.rarity]
                      const roleStyle = roleConfig[hero.role]
                      const RoleIcon = roleStyle.icon
                      
                      return (
                        <Card key={hero.id} className="transition-all hover:shadow-lg overflow-hidden">
                          <div className={`h-2 ${rarityStyle.bgColor}`} />
                          <CardHeader>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-16 h-16 rounded-full ${rarityStyle.bgColor} flex items-center justify-center`}>
                                  <RoleIcon weight="fill" className={roleStyle.color} size={32} />
                                </div>
                                <div>
                                  <CardTitle className="text-2xl mb-1">{hero.name}</CardTitle>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className={`${rarityStyle.color}`}>
                                      <Star weight="fill" className="mr-1" size={12} />
                                      {rarityStyle.label}
                                    </Badge>
                                    <Badge variant="secondary" className={roleStyle.color}>
                                      {roleStyle.label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <CardDescription className="text-base">{hero.description}</CardDescription>
                          </CardHeader>
                          
                          <CardContent className="space-y-6">
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Gauge className="text-accent" size={18} weight="fill" />
                                Combat Stats
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Sword size={16} className="text-red-500" />
                                    Attack
                                  </div>
                                  <p className="text-xl font-bold">{hero.stats.attack}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Shield size={16} className="text-blue-500" />
                                    Defense
                                  </div>
                                  <p className="text-xl font-bold">{hero.stats.defense}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Heart size={16} className="text-green-500" weight="fill" />
                                    HP
                                  </div>
                                  <p className="text-xl font-bold">{hero.stats.hp}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Sneaker size={16} className="text-yellow-500" />
                                    Speed
                                  </div>
                                  <p className="text-xl font-bold">{hero.stats.speed}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Flame className="text-accent" size={18} weight="fill" />
                                Abilities
                              </h4>
                              <div className="space-y-3">
                                {hero.abilities.map((ability, index) => (
                                  <div key={index} className="bg-muted/30 rounded-lg p-3 border border-border">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={ability.type === 'active' ? 'default' : 'secondary'} className="text-xs">
                                          {ability.type === 'active' ? 'Active' : 'Passive'}
                                        </Badge>
                                        <span className="font-semibold text-sm">{ability.name}</span>
                                      </div>
                                      {ability.cooldown && (
                                        <span className="text-xs text-muted-foreground">{ability.cooldown}s CD</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{ability.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                                  <ArrowUp size={16} weight="bold" />
                                  Strengths
                                </h4>
                                <ul className="space-y-1">
                                  {hero.strengths.map((strength, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" weight="fill" />
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                                  <ArrowDown size={16} weight="bold" />
                                  Weaknesses
                                </h4>
                                <ul className="space-y-1">
                                  {hero.weaknesses.map((weakness, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" weight="bold" />
                                      {weakness}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Users size={16} className="text-accent" weight="fill" />
                                Best With
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {hero.bestWith.map((synergy, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {synergy}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                              <h4 className="font-semibold mb-2 flex items-center gap-2 text-accent">
                                <Target size={16} weight="fill" />
                                Tactical Tips
                              </h4>
                              <ul className="space-y-2">
                                {hero.tacticalTips.map((tip, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <Lightning size={14} className="text-accent mt-0.5 flex-shrink-0" weight="fill" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="community" className="space-y-6">
                {filteredTips.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users size={48} className="text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">No community tips yet</p>
                      <p className="text-muted-foreground text-center mb-4">Be the first to share your strategy!</p>
                      <Button onClick={() => setDialogOpen(true)} className="gap-2">
                        <PencilSimple weight="fill" size={18} />
                        Submit First Tip
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {(filteredTips || []).map((tip) => {
                      const config = categoryConfig[tip.category]
                      const Icon = config.icon
                      return (
                        <Card key={tip.id} className="transition-all hover:shadow-lg hover:scale-[1.02]">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <Icon weight="fill" className={`${config.color}`} size={32} />
                              <Badge variant="secondary">{config.label}</Badge>
                            </div>
                            <CardTitle className="text-xl">{tip.title}</CardTitle>
                            <CardDescription>By {tip.author}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{tip.content}</p>
                            <p className="text-xs text-muted-foreground mt-4">
                              {new Date(tip.submittedAt).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="faq">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                    <CardDescription>Quick answers to common Last War questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left font-medium">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App