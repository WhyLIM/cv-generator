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
  description?: string; // Optional work description
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
  bulletListType?: 'unordered' | 'ordered';
}

export interface CustomSection {
  id: string;
  title: string;
  visible: boolean;
  items: CustomItem[];
}

// 一个联系方式条目（如邮箱 / 电话 / GitHub / 个人网站等）
export interface ContactLink {
  id: string;
  label: string;        // 显示文字；空字符串时回退为去掉协议的 url
  url: string;          // 完整链接目标（支持 tel: / mailto: / https://）
  icon: string;         // FontAwesome class，如 'fa-solid fa-phone'
  visible?: boolean;    // 默认 true；false 时不在预览中渲染
}

export interface CvData {
  themeColor: string;
  fontScale?: number; // 字体缩放比例，默认 1.0
  personal: {
    name: string;
    nameZh?: string;
    // 旧联系方式字段（保留以便一次性迁移到 contactLinks），不再在 UI 中编辑
    phone?: string;
    email?: string;
    github?: string;
    githubUrl?: string;
    website?: string;
    websiteUrl?: string;
    // 新的联系方式列表（替代上述旧字段）
    contactLinks?: ContactLink[];
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
