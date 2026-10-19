declare module 'lucide-react' {
  import * as React from 'react'

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number
    color?: string
    strokeWidth?: string | number
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >

  export const Utensils: LucideIcon
  export const UtensilsCrossed: LucideIcon
  export const CalendarDays: LucideIcon
  export const BookOpen: LucideIcon
  export const Search: LucideIcon
  export const ShoppingBag: LucideIcon
  export const LogIn: LucideIcon
  export const Clock: LucideIcon
  export const MapPin: LucideIcon
  export const Phone: LucideIcon
  export const ShieldCheck: LucideIcon
  export const Sparkles: LucideIcon
  export const ArrowRight: LucideIcon
  export const ArrowUpRight: LucideIcon
  export const Coffee: LucideIcon
  export const CheckCircle2: LucideIcon
  export const XCircle: LucideIcon
  export const AlertCircle: LucideIcon
  export const Users: LucideIcon
  export const Info: LucideIcon
  export const FileText: LucideIcon
  export const Plus: LucideIcon
  export const Minus: LucideIcon
  export const Trash2: LucideIcon
  export const Filter: LucideIcon
  export const Check: LucideIcon
  export const CalendarCheck: LucideIcon
  export const CreditCard: LucideIcon
  export const QrCode: LucideIcon
  export const Building2: LucideIcon
  export const Wallet: LucideIcon
  export const Receipt: LucideIcon
  export const AlertTriangle: LucideIcon
  export const RotateCcw: LucideIcon
  export const Copy: LucideIcon
  export const ShieldAlert: LucideIcon
  export const Download: LucideIcon
  export const Share2: LucideIcon
  export const ChefHat: LucideIcon
  export const Store: LucideIcon
  export const LayoutDashboard: LucideIcon
  export const Layers: LucideIcon
  export const BarChart3: LucideIcon
  export const Settings: LucideIcon
  export const LogOut: LucideIcon
  export const Eye: LucideIcon
  export const Calendar: LucideIcon
  export const Menu: LucideIcon
  export const X: LucideIcon
  export const ExternalLink: LucideIcon
  export const Printer: LucideIcon
  export const ChevronRight: LucideIcon
  export const ChevronLeft: LucideIcon
  export const Edit: LucideIcon
  export const Image: LucideIcon
  export const Banknote: LucideIcon
  export const History: LucideIcon
  export const Volume2: LucideIcon
  export const VolumeX: LucideIcon
  export const Play: LucideIcon
  export const RefreshCw: LucideIcon
  export const Flame: LucideIcon
  export const DollarSign: LucideIcon
  export const TrendingUp: LucideIcon
  export const FileSpreadsheet: LucideIcon
  export const PieChart: LucideIcon
  export const HelpCircle: LucideIcon
  export const Shield: LucideIcon
  export const Percent: LucideIcon
  export const Save: LucideIcon
  export const Lock: LucideIcon
  export const Mail: LucideIcon

  export default LucideIcon
}

declare module 'jspdf-autotable' {
  export default function autoTable(doc: any, options: any): void
}
