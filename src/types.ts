export interface Author {
  name: string;
  isFirst: boolean;
  isCorresponding: boolean;
  isMe: boolean;
}

export interface Article {
  id: string;
  authors: Author[];
  title: string;
  journal: string;
  year: string;
  volumeAndIssue?: string;
  pages?: string;
  doi: string;
  impactFactor?: number;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface Employment {
  id: string;
  role: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface Skill {
  id: string;
  category: string;
  icon: string; // font awesome class
  items: string[];
}

export interface Conference {
  id: string;
  dateStr: string;
  name: string;
  location: string;
  type: string;
}

export interface Funding {
  id: string;
  source: string;
  grantNo: string;
  title: string;
  period: string;
  role: string;
}

export interface AwardLink {
  label: string;
  url: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  dateStr: string;
  description: string;
  links: AwardLink[];
}

export interface SectionConfig {
  title: string;
  visible: boolean;
}

export interface CustomItem {
  id: string;
  title: string;
  subtitle: string;
  dateStr: string;
  location: string;
  description: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  visible: boolean;
  items: CustomItem[];
}

export interface CvData {
  themeColor: string;
  fontScale?: number; // 字体缩放比例，默认 1.0
  personal: {
    name: string;
    nameZh?: string;
    phone: string;
    email: string;
    github: string;
    githubUrl: string;
    website: string;
    websiteUrl: string;
    photoUrl?: string;     // Added
    showPhoto?: boolean;   // Added
    documentTitle?: string;
    showDocumentTitle?: boolean;
    footerTitle?: string;
    showFooterTitle?: boolean;
    lastModifiedText?: string;
    showLastModified?: boolean;
  };
  sectionSettings?: {
    education?: SectionConfig;
    employment?: SectionConfig;
    skills?: SectionConfig;
    articles?: SectionConfig;
    conferences?: SectionConfig;
    academic?: SectionConfig; // includes societyServices, reviews, fundings
    awards?: SectionConfig;
  };
  customTitles?: {       // Retained for backwards compatibility if needed
    education?: string;
    employment?: string;
    skills?: string;
    articles?: string;
    conferences?: string;
    academic?: string;
    awards?: string;
  };
  education: Education[];
  employment: Employment[];
  skills: Skill[];
  articles: Article[];
  conferences: Conference[];
  societyServices: string[];
  reviews: string[];
  contributions: string[];
  fundings: Funding[];
  awards: Award[];
  customSections?: CustomSection[];
  sectionOrder?: string[];
}
