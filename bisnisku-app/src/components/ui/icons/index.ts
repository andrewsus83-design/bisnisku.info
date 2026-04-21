/**
 * Bisnisku Icon System v1.0
 *
 * Usage:
 *   // Dynamic icon by name
 *   import { BiIcon } from "@/components/ui/icons";
 *   <BiIcon name="home" size="md" />
 *
 *   // Named import (tree-shakeable)
 *   import { BiHome, BiStar, BiWhatsapp } from "@/components/ui/icons";
 *   <BiHome size="lg" className="text-brand-primary" />
 *
 *   // All available icon names (useful for selectors/pickers)
 *   import { ICON_NAMES } from "@/components/ui/icons";
 *
 *   // Type for icon names
 *   import type { BiIconName, BiIconSize } from "@/components/ui/icons";
 */
export {
  // Core component + types
  BiIcon,
  BISNISKU_ICON_PATHS,
  ICON_NAMES,
  type BiIconName,
  type BiIconSize,
  type BiIconProps,

  // Named exports — business & navigation
  BiHome,
  BiInfo,
  BiTag,
  BiService,
  BiMenu,
  BiUtensils,
  BiPhone,
  BiLink,
  BiMapPin,
  BiImage,
  BiStar,
  BiCalendar,
  BiCode,

  // Named exports — editor & UI
  BiLayers,
  BiPalette,
  BiMonitor,
  BiSmartphone,
  BiSave,
  BiGlobe,
  BiChevronUp,
  BiChevronDown,
  BiChevronLeft,
  BiChevronRight,
  BiEye,
  BiEyeOff,
  BiArrowRight,
  BiArrowLeft,

  // Named exports — communication & social
  BiMail,
  BiMessageCircle,
  BiInstagram,
  BiFacebook,
  BiExternal,
  BiWhatsapp,
  BiTiktok,

  // Named exports — actions & status
  BiSearch,
  BiFire,
  BiPlus,
  BiMinus,
  BiX,
  BiCheck,
  BiSettings,
  BiUsers,
  BiUser,
  BiHeart,
  BiTrendingUp,
  BiClock,
  BiGift,
  BiBarChart,
  BiQrcode,
  BiLogout,
  BiDragHandle,
  BiTrash,
  BiEdit,
  BiCopy,
} from "./bisnisku-icons";
