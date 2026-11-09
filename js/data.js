/* =====================================================================
   SITE CONTENT
   Everything shown on the website (roles, papers, skills, education)
   lives in this file and is rendered by the page scripts.
   ===================================================================== */

const SITE = {
  name: "Hasan Alanya",
  roles: [
    "Computational Biologist",
    "Bioinformatician",
    "Machine Learning Researcher",
    "Marie Skłodowska-Curie Fellow",
    "Multi-omics Data Scientist",
  ],
  tagline:
    "I build interpretable machine-learning and network models on multi-omics data to understand how we age and how tumours evolve, and to find existing drugs that could change the course of both.",
  location: "Birmingham, UK",
  github: "https://github.com/hasanalanya",
  linkedin: "https://www.linkedin.com/in/hasanalanya/",
};

/* Three short proof points under the hero buttons */
const HIGHLIGHTS = [
  { label: "Fellowship", text: "Marie Skłodowska-Curie, Horizon Europe" },
  { label: "Publications", text: "6 peer-reviewed papers, incl. Nature Communications" },
  { label: "Affiliations", text: "University of Birmingham · Yale" },
];

const STATS = [
  { value: 6, suffix: "", label: "Peer-reviewed papers (+1 under review)" },
  { value: 10, suffix: "+", label: "Years of research experience" },
  { value: 4, suffix: "", label: "Countries of research" },
  { value: 3, suffix: "", label: "Students mentored" },
];

const INTERESTS = [
  {
    icon: "hourglass",
    title: "Ageing & drug repurposing",
    text: "Predicting which approved drugs could slow ageing and frailty by linking compounds, genes and pathways to senescence-associated molecular states.",
  },
  {
    icon: "brain",
    title: "Cancer genomics",
    text: "Multi-omic profiling of primary brain tumours: inter- and intra-tumour heterogeneity, rare subtypes, tumour evolution and the immune microenvironment.",
  },
  {
    icon: "network",
    title: "Graph & causal ML",
    text: "Network-based models, graph neural networks and causal inference that stay interpretable, so every prediction leads to a testable hypothesis.",
  },
  {
    icon: "layers",
    title: "Multi-omics integration",
    text: "Combining genomic, transcriptomic, epigenetic, proteomic and single-cell data in reproducible Nextflow and Snakemake pipelines.",
  },
];

/* Places on the "research journey" strip, oldest first */
const JOURNEY = [
  { city: "Istanbul", country: "Türkiye", years: "2014–2019", what: "BSc Genetics & Bioengineering; protein-interaction research at Koç University" },
  { city: "Stockholm", country: "Sweden", years: "2019–2021", what: "MSc at Karolinska Institutet; systems medicine at SciLifeLab" },
  { city: "New Haven", country: "USA", years: "2022–2025", what: "Brain-tumour genomics at Yale School of Medicine" },
  { city: "Birmingham", country: "UK", years: "2025–now", what: "PhD in ageing biology as an MSCA Doctoral Fellow" },
];

const EXPERIENCE = [
  {
    org: "University of Birmingham",
    role: "PhD Researcher · Marie Skłodowska-Curie Doctoral Fellow",
    dates: "Oct 2025 – Present",
    place: "Birmingham, UK",
    current: true,
    group: "Genomics of Ageing & Rejuvenation Lab, Institute of Inflammation and Ageing · Supervisor: Prof. João Pedro de Magalhães",
    link: "https://rejuvenomicslab.com/",
    tags: ["Graph neural networks", "Causal ML", "Multi-omics", "Drug repurposing", "Ageing"],
    points: [
      "Developing interpretable machine-learning models (network-based methods, GNNs and causal ML) to predict drugs that could be repurposed against ageing and frailty.",
      "Integrating large-scale genomic, transcriptomic, epigenetic and proteomic data to pinpoint the molecular signatures that drive ageing.",
      "Mapping drug–gene–pathway interactions to identify compounds that may reverse senescence-associated biological states.",
      "Funded by a Horizon Europe Marie Skłodowska-Curie Doctoral Fellowship (2025–2028).",
    ],
  },
  {
    org: "Yale School of Medicine",
    role: "Research Affiliate (remote)",
    dates: "Sep 2025 – Present",
    place: "New Haven, CT, USA",
    current: true,
    group: "Erson Lab, Department of Neurosurgery · Co-supervised by Prof. Murat Günel, Chair of Neurosurgery",
    link: "https://ersonlab.org",
    tags: ["Cancer genomics", "Tumour evolution", "Single-cell", "Pipelines"],
    points: [
      "Continuing integrative multi-omic studies of primary brain tumours, covering heterogeneity, rare subtypes, tumour evolution and tumour–immune interactions.",
      "Building and running pipelines across genomic, transcriptomic, epigenetic and single-cell-informed bulk data.",
      "Working with neurosurgical and clinical teams to turn molecular findings into clinically relevant insight.",
    ],
  },
  {
    org: "Yale School of Medicine",
    role: "Postgraduate Research Associate",
    dates: "Jan 2022 – Sep 2025",
    place: "New Haven, CT, USA",
    group: "Erson Lab, Department of Neurosurgery · Co-supervised by Prof. Murat Günel, Chair of Neurosurgery",
    link: "https://ersonlab.org",
    tags: ["Whole-exome sequencing", "RNA-seq", "Epigenomics", "Brain tumours"],
    points: [
      "Carried out integrative computational analysis of multi-level, multi-omic tumour datasets, with a focus on tumour heterogeneity and rare tumour subtypes.",
      "Profiled the genomic, transcriptomic and epigenetic landscape of primary brain tumours, both between and within tumours.",
      "Studied tumour–immune cell interactions across brain-tumour types.",
      "Co-authored six peer-reviewed papers from this work, two as first author, and mentored three summer research students.",
    ],
  },
  {
    org: "SciLifeLab · KTH",
    role: "Master's Thesis Researcher",
    dates: "Jan 2021 – Jul 2021",
    place: "Stockholm, Sweden",
    group: "Systems Medicine Group (Mardinoglu Lab) · Supervisors: Prof. Adil Mardinoglu & Dr. Havva Özlem Altay",
    link: "https://sysmedicine.com",
    tags: ["Co-expression networks", "Sarcopenia", "Systems biology"],
    points: [
      "Thesis: a gene co-expression network analysis of muscle tissue revealing novel genes and molecular pathways underlying sarcopenia.",
      "The resulting manuscript has been submitted and is under review.",
    ],
  },
  {
    org: "SciLifeLab · KTH",
    role: "Research Student",
    dates: "Aug 2020 – Jan 2021",
    place: "Stockholm, Sweden",
    group: "Systems Medicine Group (Mardinoglu Lab)",
    link: "https://sysmedicine.com",
    tags: ["Proteomics", "Metabolomics", "Metagenomics", "Statistics"],
    points: [
      "Analysed raw proteomics, transcriptomics, metabolomics and metagenomics data across disease and environmental conditions.",
      "Benchmarked statistical methods for each omics type and compared their results.",
    ],
  },
  {
    org: "Istanbul Bilgi University",
    role: "Bachelor's Thesis Researcher",
    dates: "Sep 2017 – Jan 2019",
    place: "Istanbul, Türkiye",
    group: "Supervisor: Asst. Prof. Özlem Ulucan Açan",
    link: "https://www.bilgi.edu.tr/en/academic/staff/ozlem-ulucan-acan/",
    linkLabel: "Supervisor profile",
    tags: ["Machine learning", "Microarray", "Gastric cancer"],
    points: [
      "Thesis: classification of gastric cancer from gene-expression profiles.",
      "Applied machine learning to microarray data to define molecular subtypes of gastric cancer and identify subtype-specific biomarkers.",
      "Defended with the highest possible grade.",
    ],
  },
  {
    org: "Koç University",
    role: "Research Student (KUSRP Scholar)",
    dates: "Jul 2016 – Sep 2018",
    place: "Istanbul, Türkiye",
    group: "Center for Computational and Systems Biology (COSBI Lab) · Supervisor: Prof. Özlem Keskin",
    link: "https://vprd.ku.edu.tr/en/graduate-undergraduate-program-features/",
    linkLabel: "KUSRP programme",
    tags: ["Protein–protein interactions", "Docking", "PRISM", "Python"],
    points: [
      "Built a non-redundant dataset of protein–protein interfaces (2017–2018).",
      "Analysed and ranked protein–protein docking models using CAPRI criteria (2016–2017).",
      "Predicted protein–protein interactions with the PRISM algorithm as a two-time Koç University Summer Research Program scholar (2016, 2017).",
    ],
  },
];

const EDUCATION = [
  {
    degree: "PhD",
    field: "Ageing biology & machine learning",
    school: "University of Birmingham",
    place: "Birmingham, UK",
    years: "2025 – 2028",
    note: "Marie Skłodowska-Curie Doctoral Fellowship, Horizon Europe",
  },
  {
    degree: "MSc",
    field: "Molecular Techniques in Life Science",
    school: "Karolinska Institutet · KTH · Stockholm University",
    place: "Stockholm, Sweden",
    years: "2019 – 2021",
    note: "Joint programme of three Stockholm universities",
    link: "https://www.kth.se/en/studies/master/molecular-techniques-life-science/course-overview-1.501285",
  },
  {
    degree: "BSc",
    field: "Genetics and Bioengineering",
    school: "Istanbul Bilgi University",
    place: "Istanbul, Türkiye",
    years: "2014 – 2019",
    note: "ÖSYM national scholarship · thesis awarded the highest grade",
    link: "https://ects.bilgi.edu.tr/Department/Curriculum?catalog_departmentId=82607",
  },
];

/* type: journal | abstract | presentation | preparation
   featured: true  → also shown as a highlight card above the list
   summary         → one line used on the highlight card            */
const PUBLICATIONS = [
  {
    type: "journal", year: 2025, featured: true,
    title: "Subgroup of Meningiomas Involving FOS and FOSB Gene Fusions",
    summary: "Defines a distinct meningioma subgroup driven by FOS and FOSB gene fusions.",
    authors: "Yalcin K, Alanya H, Gultekin B, Samper D, Barak T, Miyagishima D, Youngblood MW, Hjerthen MG, Brooks A, Samuel N, O'Brien J, Chavez MM, Dincer A, Wu H, Omay SB, Yasuno K, Bilguvar K, Ercan-Sencicek AG, Mishra-Gorur K, McGuone D, Moliterno J, Gunel M, Erson-Omay EZ",
    venue: "Nature Communications, 16, 10532",
    journal: "Nature Communications",
    link: "https://www.nature.com/articles/s41467-025-65549-7",
    tags: ["Meningioma", "Gene fusions"],
  },
  {
    type: "journal", year: 2025, featured: true,
    title: "Genomic Characterization of a Rare Skull-Base Plasmacytoma",
    summary: "Genomic profiling of a rare plasmacytoma arising at the skull base.",
    authors: "Alanya H, Kasturi S, Yalcin K, Gultekin B, Kumar D, Samuel N, Samper D, Mishra-Gorur K, Gunel M, Erson-Omay EZ, Omay B",
    venue: "Frontiers in Oncology, 15:1645502",
    journal: "Frontiers in Oncology",
    link: "https://www.frontiersin.org/journals/oncology/articles/10.3389/fonc.2025.1645502/full",
    tags: ["Rare tumours", "Genomics"],
  },
  {
    type: "journal", year: 2025,
    title: "SMARCB1 Mutation in Spinal Meningioma Represents Branched Evolution in a Non-NF2 Patient with Multiple Meningiomas",
    authors: "Gupta M, Samiappan SPS, Alanya H, Yalcin K, Gultekin B, Sharaf R, Elsamadicy A, Figuera DS, Samuel N, Mishra-Gorur K, Kolb L, McGuone D, Gunel M, Erson-Omay EZ, Moliterno J, Mendel E",
    venue: "Neuro-Oncology Advances, 7(1), vdaf067",
    link: "https://academic.oup.com/noa/article/7/1/vdaf067/8097631",
    tags: ["Tumour evolution", "Meningioma"],
  },
  {
    type: "journal", year: 2025,
    title: "Systems Biology-Based Drug Repositioning Approach Identifies Drug Candidates for Sarcopenia Treatment",
    authors: "Yuan M, Shong K, Li X, Ashraf S, Ozcan M, Alanya H, Kim W, Turkez H, Zhang C, Altay O, Mardinoglu A",
    venue: "Under review at Cell Reports",
    tags: ["Drug repurposing", "Systems biology"],
  },
  {
    type: "journal", year: 2024,
    title: "Variations in the Genomic Profiles and Clinical Behavior of Meningioma by Racial and Ethnic Group",
    authors: "Tabor JK, O'Brien J, Lei H, Vetsa S, Vasandani S, Jalal MI, Alanya H, et al.",
    venue: "Journal of Neurosurgery, Mar 22:1–9",
    link: "https://thejns.org/view/journals/j-neurosurg/aop/article-10.3171-2024.1.JNS231633/article-10.3171-2024.1.JNS231633.xml",
    tags: ["Meningioma", "Clinical genomics"],
  },
  {
    type: "journal", year: 2023,
    title: "Thrombocyte-derived Dickkopf1 Promotes Macrophage Polarization in the Bleomycin-induced Lung Injury Model",
    authors: "Sung EA, Park MH, Song S, Alanya H, Henegariu O, Liu J, Erson-Omay EZ, Sime PJ, Chae W",
    venue: "Frontiers in Immunology, 14:1247330",
    link: "https://www.frontiersin.org/articles/10.3389/fimmu.2023.1247330/full",
    tags: ["Immunology", "Transcriptomics"],
  },
  {
    type: "journal", year: 2023, featured: true,
    title: "Sporadic Pituitary Adenoma with Somatic Double-Hit Loss of MEN1",
    summary: "Shows how a somatic double-hit loss of MEN1 can drive a sporadic pituitary adenoma.",
    authors: "Alanya H, Hong CS, DiStasio M, Boulware SD, Rimmer RA, Omay SB, Erson-Omay EZ",
    venue: "Pituitary, 26, 488–494",
    journal: "Pituitary",
    link: "https://link.springer.com/article/10.1007/s11102-023-01336-1",
    tags: ["Pituitary adenoma", "Somatic variants"],
  },
  {
    type: "abstract", year: 2025,
    title: "Somatic Loss of BCLAF-1 in an Encephalocele Secondary to Idiopathic Intracranial Hypertension",
    authors: "Lau S, Alanya H, Rimmer R, Gunel M, Omay SB, Erson-Omay EZ",
    venue: "North American Skull Base Society (NASBS), New Orleans, LA",
    link: "https://drive.google.com/file/d/1fPlWxvCkwC23zd8mgOlDTkLYokl-PQ5F/view?usp=sharing",
  },
  {
    type: "abstract", year: 2024, presenter: true,
    title: "Genomic Characterization of Growth Hormone Secreting Pituitary Adenomas",
    authors: "Alanya H, Yalcin K, Hilton B, Gultekin B, Mishra-Gorur K, McGuone D, Gunel M, Omay SB, Erson-Omay EZ",
    venue: "Society for Neuro-Oncology (SNO), Houston, TX",
    link: "https://academic.oup.com/neuro-oncology/article/26/Supplement_8/viii9/7889569",
  },
  {
    type: "abstract", year: 2022, presenter: true,
    title: "Utilization of Single Cell Data in Re-Analysis of Bulk Data: Presented in Pituitary Adenomas",
    authors: "Alanya H, Erson-Omay EZ",
    venue: "Second Annual Yale Single Cell Symposium, New Haven, CT",
    link: "https://drive.google.com/file/d/1Y4-JBlOORXKtxHmAkSgWOwJQlryYPvIs/view?usp=sharing",
  },
  {
    type: "presentation", year: 2024,
    title: "Genomic Characterization of Growth Hormone Secreting Pituitary Adenomas",
    authors: "Alanya H, Yalcin K, Hilton B, Gultekin B, Mishra-Gorur K, McGuone D, Gunel M, Omay SB, Erson-Omay EZ",
    venue: "Poster · 29th Annual Meeting of the Society for Neuro-Oncology (SNO), Houston, TX",
    link: "https://virtual.oxfordabstracts.com/event/public/18018/submission/880",
  },
  {
    type: "presentation", year: 2022,
    title: "Utilization of Single Cell Data in Re-Analysis of Bulk Data: Presented in Pituitary Adenomas",
    authors: "Alanya H, Erson-Omay EZ",
    venue: "Oral · Second Annual Yale Single Cell Symposium, New Haven, CT",
  },
  {
    type: "presentation", year: 2021,
    title: "A Gene Co-Expression Network-Based Analysis of Muscle Tissues to Reveal Novel Genes and Molecular Pathways Underlying Sarcopenia",
    authors: "Alanya H, Altay O, Mardinoglu A",
    venue: "Oral · Master's dissertation, KI–KTH–SU, Sweden",
  },
  {
    type: "presentation", year: 2018,
    title: "Classification of Gastric Cancer Based on Gene Expression Profiles",
    authors: "Alanya H, Ulucan-Acan O",
    venue: "Poster · Bachelor's dissertation, Istanbul Bilgi University",
  },
  { type: "preparation", year: null, title: "Dissecting the Molecular Mechanisms of Meningioma-Associated Hyperostosis Reveals Genomic Patterns That Drive Bone Remodelling" },
  { type: "preparation", year: null, title: "Combinatorial Chimeric Lassa-VSV Virus and Drug Therapy Targets and Destroys Aggressive Meningiomas and Increases Survival" },
  { type: "preparation", year: null, title: "Genomic Characterization of Growth Hormone Secreting Pituitary Adenomas" },
  { type: "preparation", year: null, title: "Whole-Exome Sequencing Reveals Inheritance Patterns in Autism Spectrum Disorder Among Consanguineous Populations" },
];

/* Skill graph: each group becomes a hub in the interactive network */
const SKILLS = [
  { group: "Programming", color: "#ff5a4e", items: ["Python", "R", "Shell", "SQL", "MATLAB", "Java"] },
  { group: "Machine Learning", color: "#ff9a3d", items: ["TensorFlow", "scikit-learn", "GNNs", "Causal ML", "NumPy", "Pandas", "Seaborn", "Jupyter"] },
  { group: "Workflows & Infra", color: "#ffc857", items: ["Nextflow", "Snakemake", "Docker", "Singularity", "Git", "Bioconductor"] },
  { group: "Bulk RNA-seq", color: "#ff6b9a", items: ["STAR", "HISAT2", "Salmon", "DESeq2", "edgeR", "featureCounts", "FastQC", "MultiQC", "GSEA", "Enrichr", "g:Profiler"] },
  { group: "Single-cell", color: "#c77dff", items: ["Seurat", "Scanpy", "Cell Ranger", "UMAP", "Leiden", "Monocle", "Velocyto", "Slingshot", "SCENIC"] },
  { group: "Genomics / WES", color: "#4fc1b0", items: ["GATK", "SAMtools", "BWA", "Bowtie2", "ANNOVAR", "SnpEff", "VEP", "Somalier", "KING"] },
  { group: "Microarray & miRNA", color: "#e07a5f", items: ["limma", "affy", "GEO2R", "RankProd", "GenePattern", "miRDeep2"] },
  { group: "Proteomics & Networks", color: "#8d7bff", items: ["STRING", "BioGRID", "Cytoscape", "GeneMANIA", "PSIQUIC", "Scaffold", "Reactome"] },
  { group: "Structural Biology", color: "#d4a373", items: ["PyMOL", "Chimera", "AutoDock Vina", "MODELLER", "Rosetta", "SWISS-MODEL", "PRISM"] },
];

const AWARDS = [
  { year: "2025–2028", title: "Marie Skłodowska-Curie Doctoral Fellowship", org: "Horizon Europe" },
  { year: "2019", title: "Bachelor's thesis awarded the highest possible grade", org: "Istanbul Bilgi University" },
  { year: "2014–2019", title: "National undergraduate scholarship", org: "ÖSYM, Türkiye" },
  { year: "2016 & 2017", title: "Summer Research Program Scholar (KUSRP)", org: "Koç University" },
  { year: "2012", title: "Worldwide Photo Contest Finalist", org: "Talenthouse Inc., Palo Alto" },
];

const MENTORING = [
  { name: "Sebastian Reyes", detail: "BS, Molecular, Cellular & Developmental Biology, Yale", year: "Summer 2024" },
  { name: "Alp Macun", detail: "High-school research student", year: "Summer 2024" },
  { name: "Lana Zheng", detail: "BS, Molecular Biophysics & Biochemistry, Yale", year: "Summer 2023" },
];

const TRAINING = [
  { date: "May 2021", title: "Containers & Nextflow", org: "Centre for Genomic Regulation (CRG), Barcelona" },
  { date: "Nov 2020", title: "Biomedical data for AI: 7th RIKEN–KI–SciLifeLab Symposium", org: "Stockholm" },
  { date: "Oct 2020", title: "AI for diagnosis and grading of prostate cancer", org: "SciLifeLab AI Seminar Series" },
  { date: "Sep 2020", title: "Drug design applied to COVID-19", org: "Swiss Institute of Bioinformatics" },
  { date: "Apr 2020", title: "Tools for regulatory genomics (ISMARA, CRUNCH, EPD, ChIP-seq)", org: "Swiss Institute of Bioinformatics" },
  { date: "Mar 2020", title: "Supercomputing Frontiers Europe 2020", org: "Warsaw" },
];

const LANGUAGES = [
  { name: "Turkish", level: "Native", pct: 100 },
  { name: "English", level: "Fluent", pct: 92 },
  { name: "Swedish", level: "Beginner", pct: 22 },
  { name: "Spanish", level: "Beginner", pct: 20 },
];
