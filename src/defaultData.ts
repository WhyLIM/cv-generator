import { CvData } from './types';

export const defaultData: CvData = {
  themeColor: '#01a3a4',
  fontScale: 1,
  personal: {
    name: 'Min Li',
    nameZh: '李旻',
    phone: '+86 18851387887',
    email: 'mli.bio@outlook.com',
    github: 'WhyLIM',
    githubUrl: 'https://github.com/WhyLIM',
    website: 'CV',
    websiteUrl: 'https://cv.limina.top',
    showPhoto: false,
    photoUrl: '',
    documentTitle: 'Curriculum Vitae',
    showDocumentTitle: true,
    footerTitle: 'Curriculum Vitae',
    showFooterTitle: true,
    lastModifiedText: 'Last modified: 2026.04.23',
    showLastModified: true
  },
  sectionSettings: {
    education: { title: 'EDUCATION', visible: true },
    employment: { title: 'EMPLOYMENT', visible: true },
    skills: { title: 'SKILLS', visible: true },
    articles: { title: 'PEER-REVIEWED ARTICLES', visible: true },
    conferences: { title: 'CONFERENCE PROCEEDINGS', visible: true },
    academic: { title: 'ACADEMIC CONTRIBUTIONS', visible: true },
    awards: { title: 'SELECTED AWARDS AND HONORS', visible: true }
  },
  sectionOrder: ['education', 'employment', 'skills', 'articles', 'conferences', 'academic', 'awards'],
  customSections: [],
  education: [
    {
      id: 'ed1',
      degree: 'Bachelor of Sciences in Bioinformatics',
      institution: 'Soochow University',
      location: 'Suzhou, Jiangsu, China',
      startDate: 'Sep 2018',
      endDate: 'Jun 2022'
    }
  ],
  employment: [
    {
      id: 'em1',
      role: 'Assistant Engineer',
      institution: 'Institute of Scientific Instruments (Preparatory), Shenzhen Institute of Advanced Technology (SIAT), Chinese Academy of Sciences',
      location: 'Shenzhen, Guangdong, China',
      startDate: 'July 2025',
      endDate: 'present'
    },
    {
      id: 'em2',
      role: 'Research Assistant',
      institution: 'Medical Research Institute, Guangdong Provincial People\'s Hospital (Guangdong Academy of Medical Sciences), Southern Medical University',
      location: 'Guangzhou, Guangdong, China',
      startDate: 'April 2023',
      endDate: 'May 2025'
    }
  ],
  skills: [
    {
      id: 'sk1',
      category: 'Operating system',
      icon: 'fa-solid fa-desktop',
      items: ['Windows', 'Linux (Zorin, Ubuntu, CentOS, Kali)', 'Hackintosh']
    },
    {
      id: 'sk2',
      category: 'Programming language',
      icon: 'fa-solid fa-code',
      items: ['Python', 'R', 'HTML', 'CSS', 'JavaScript', 'VUE3', 'MySQL']
    }
  ],
  articles: [
    {
      id: 'ar1',
      authors: [
        { name: 'Li, M.', isFirst: true, isCorresponding: false, isMe: true },
        { name: 'Liu, S.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Ma, S.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Shang, X.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Zhang, X.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Jason, H.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Huang, Y.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Kiburg, K.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Zhao, K.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Hu, G.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Zhang, L.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Yu, H.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'He, M.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Zhang, X.', isFirst: false, isCorresponding: true, isMe: false }
      ],
      title: 'Network-based hub biomarker discovery for glaucoma.',
      journal: 'BMJ Open Ophthalmol',
      year: '2024',
      volumeAndIssue: '9(1)',
      doi: '10.1136/bmjophth-2024-001915',
      impactFactor: 2.0
    },
    {
      id: 'ar2',
      authors: [
        { name: 'Zhang, X.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Li, M.', isFirst: true, isCorresponding: false, isMe: true },
        { name: 'Ye, S.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Shen, K.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Yuan, H.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Bakhtyar, S.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Peng, Q.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Liu, Y.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Wang, Y.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Li, M.', isFirst: false, isCorresponding: true, isMe: false }
      ],
      title: 'CBD2: A functional biomarker database for colorectal cancer.',
      journal: 'iMeta',
      year: '2024',
      volumeAndIssue: 'e155',
      doi: '10.1002/imt2.155',
      impactFactor: 23.7
    },
    {
      id: 'ar3',
      authors: [
        { name: 'Zhang, X.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Huang, Y.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Liu, S.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Ma, S.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Li, M.', isFirst: false, isCorresponding: false, isMe: true },
        { name: 'Zhu, Z.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Wang, W.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Zhang, X.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Liu, J.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Tang, S.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Hu, Y.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Ge, Z.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Yu, H.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'He, M.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Shang, X.', isFirst: false, isCorresponding: true, isMe: false }
      ],
      title: 'Machine learning based metabolomic and genetic profiles for predicting multiple brain phenotypes.',
      journal: 'J Transl Med',
      year: '2024',
      volumeAndIssue: '22(1)',
      pages: '1098',
      doi: '10.1186/s12967-024-05868-3',
      impactFactor: 6.1
    },
    {
      id: 'ar4',
      authors: [
        { name: 'Zhang, X.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Li, D.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Ye, S.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Liu, S.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Ma, S.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Li, M.', isFirst: false, isCorresponding: false, isMe: true },
        { name: 'Peng, Q.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Hu, L.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Shang, X.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'He, M.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Zhang, L.', isFirst: false, isCorresponding: true, isMe: false }
      ],
      title: 'Decoding the genetic comorbidity network of Alzheimer\'s disease.',
      journal: 'BioData Min',
      year: '2024',
      volumeAndIssue: '17(1)',
      pages: '40',
      doi: '10.1186/s13040-024-00394-w',
      impactFactor: 4.0
    },
    {
      id: 'ar5',
      authors: [
        { name: 'Ye, S.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Ma, S.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Liu, S.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Huang, Y.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Li, D.', isFirst: true, isCorresponding: false, isMe: false },
        { name: 'Li, M.', isFirst: false, isCorresponding: false, isMe: true },
        { name: 'Su, T.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Luo, J.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Zhang, C.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Shi, D.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Hu, L.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Zhang, L.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Yu, H.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'He, M.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Shang, X.', isFirst: false, isCorresponding: true, isMe: false },
        { name: 'Zhang, X.', isFirst: false, isCorresponding: true, isMe: false }
      ],
      title: 'Shared whole environmental etiology between Alzheimer\'s disease and age-related macular degeneration.',
      journal: 'NPJ Aging',
      year: '2024',
      volumeAndIssue: '10(1)',
      pages: '36',
      doi: '10.1038/s41514-024-00162-4',
      impactFactor: 4.1
    },
    {
      id: 'ar6',
      authors: [
        { name: 'Wang, Z.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Li, M.', isFirst: false, isCorresponding: false, isMe: true },
        { name: 'Tang, M.', isFirst: false, isCorresponding: false, isMe: false },
        { name: 'Hu, G.', isFirst: false, isCorresponding: true, isMe: false }
      ],
      title: 'From big data to complex network: a navigation through the maze of drug–target interaction.',
      journal: 'Big Data Analytics in Chemoinformatics and Bioinformatics',
      year: '2023',
      pages: '407-436',
      doi: '',
      impactFactor: 0
    }
  ],
  conferences: [
    {
      id: 'cf1',
      dateStr: 'October 9th-12th, 2024',
      name: '13th National Conference on Bioinformatics and Systems Biology',
      location: 'Haikou, Hainan, China',
      type: 'Poster presentation'
    },
    {
      id: 'cf2',
      dateStr: 'October 27th-30th, 2023',
      name: '12th National Conference on Bioinformatics and Systems Biology',
      location: 'Qingdao, Shandong, China',
      type: 'Poster presentation'
    }
  ],
  societyServices: [
    'Member, Youth Committee of Sichuan Bioinformatics Society (2023 - present)'
  ],
  reviews: [
    'Peer Reviewer for Springer Journal: BJC Reports (2024), Journal of Gastrointestinal Cancer (2025)'
  ],
  contributions: [
    'Provided expert support in protein structure modeling and docking for the paper "Loss of ESRP2 Activates TAK1-MAPK Signaling through the Fetal RNA-Splicing Program to Promote Hepatocellular Carcinoma Progression" published in Advanced Science (IF: 14.3) (doi: 10.1002/advs.202305653). Specifically acknowledged in the acknowledgements section. (2023)'
  ],
  fundings: [
    {
      id: 'fd1',
      source: 'National Natural Science Foundation of China (General Program)',
      grantNo: '32470680',
      title: 'Research on the impact of integration sites on gene-level functions to improve the efficiency of susceptibility gene mapping',
      period: '2025 - 2028',
      role: 'Participant'
    },
    {
      id: 'fd2',
      source: 'Natural Science Foundation of Guangdong Province (General Program)',
      grantNo: '2025A1515011475',
      title: 'Construction of Alzheimer\'s disease comorbidity map based on genetic-environmental interaction network',
      period: '2025 - 2027',
      role: 'Participant'
    },
    {
      id: 'fd3',
      source: 'Guangdong Provincial Medical Research Fund',
      grantNo: 'A2024494',
      title: 'Construction of a genetic map of comorbidities in Parkinson\'s disease',
      period: '2024 - 2026',
      role: 'Participant'
    }
  ],
  awards: [
    {
      id: 'aw1',
      title: 'Second Prize in the Task Challenge of the CCF Open Source Innovation Competition and the 2nd Bio-OS Open Source Open Competition',
      issuer: 'ByteDance & Intel',
      dateStr: 'Dec 2024',
      description: 'Developed an AI application and a R package for querying Drug-Target-Indication interactions, and optimized an algorithm to calculate the correlation between the three.',
      links: [
        { label: 'AI application', url: 'https://www.coze.cn/s/ikd1Ta3b/' },
        { label: 'R package', url: 'https://github.com/WhyLIM/DTII' }
      ]
    },
    {
      id: 'aw2',
      title: 'The 11th place in the Paper Reproduction Challenge of the First Bio-OS Open Source Open Competition',
      issuer: 'ByteDance',
      dateStr: 'Dec 2023',
      description: 'Successfully collaborated in a team to replicate a complex research paper, ranking 11th among 131 participating teams.',
      links: []
    },
    {
      id: 'aw3',
      title: 'Second Prize in the 2023 Guangdong Biomedical Big Data Analysis Community Innovation Competition',
      issuer: 'Guangdong Bioinformatics Society',
      dateStr: 'Dec 2023',
      description: 'Achieved Second Prize in the 2023 Guangdong Biomedical Big Data Analysis Community Innovation Competition.',
      links: []
    },
    {
      id: 'aw4',
      title: 'Biotechnology Innovation and Practice',
      issuer: 'Cold Spring Harbor Asia',
      dateStr: 'Nov 2020',
      description: 'For successfully completing the project "Biotechnology Innovation and Practice" hold by Cold Spring Harbor Asia.',
      links: []
    },
    {
      id: 'aw5',
      title: 'Second Prize in the Huawei ICT Competition 2020',
      issuer: 'HUAWEI',
      dateStr: 'Oct 2020',
      description: 'Achieved Second Prize in the Huawei China University Student ICT Competition 2020 Jiangsu Provincial Preliminary Contest (Undergraduate Cloud Track).',
      links: []
    },
    {
      id: 'aw6',
      title: 'Outstanding Volunteer of Suzhou City',
      issuer: 'Suzhou Volunteers Association',
      dateStr: 'Sep 2019',
      description: 'Selected as "Outstanding Volunteer of Suzhou City" during the summer volunteer service event at Suzhou Railway Station in 2019.',
      links: []
    }
  ]
};
