/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FashionCategoryItem {
  department: string;
  category: string;
  code: string;
  description: string;
  defaultUnit: 'pcs' | 'packs' | 'cartons' | 'metres' | 'rolls';
  commonFabrics: string[];
}

export const FASHION_DEPARTMENTS = [
  'Formal & Western Wear',
  'Women’s Ethnic Wear',
  'Dresses & Fashion',
  'Men’s Traditional Wear',
  'Textiles & Fabrics',
] as const;

export type FashionDepartment = (typeof FASHION_DEPARTMENTS)[number];

export const FASHION_HIERARCHY: Record<FashionDepartment, string[]> = {
  'Formal & Western Wear': [
    'Formal Suits',
    'Coat and Pant Sets',
    'Blazers',
    'Formal Shirts',
    'Casual Shirts',
    'T-Shirts',
    'Trousers and Formal Pants',
    'Waistcoats',
    'Office Wear',
  ],
  'Women’s Ethnic Wear': [
    'Kurta and Kurti',
    'Kurta Sets',
    'Salwar Suits',
    'Anarkali Suits',
    'Sarees',
    'Premium Sarees',
    'Designer Sarees',
    'Bridal Sarees',
    'Lehenga',
    'Premium Lehenga',
    'Bridal Lehenga',
    'Chaniya Choli',
    'Dupatta',
  ],
  'Dresses & Fashion': [
    'Party Wear Dresses',
    'Casual Dresses',
    'Evening Gowns',
    'Maxi Dresses',
    'Designer Wear',
    'Festive Wear',
    'Wedding Wear',
  ],
  'Men’s Traditional Wear': [
    'Kurta Pajama',
    'Sherwani',
    'Indo-Western Wear',
    'Nehru Jackets',
    'Wedding and Festive Wear',
  ],
  'Textiles & Fabrics': [
    'Cotton',
    'Silk',
    'Satin',
    'Linen',
    'Georgette',
    'Chiffon',
    'Velvet',
    'Net Fabric',
    'Embroidered Fabric',
    'Printed Fabric',
    'Suit Material',
    'Designer Fabric',
    'Bridal Fabric',
  ],
};

export const COMMON_FABRICS = [
  '100% Giza Cotton',
  'Pure Mulberry Silk',
  'Banarasi Katan Silk',
  'Italian Wool Blend',
  'Pure Linen',
  'Georgette with Resham Work',
  'Micro Velvet 9000',
  'Pure Chiffon',
  'Duchess Satin',
  'Heavy Net with Zari Work',
  'Raw Silk / Tussar',
  'Chanderi Silk',
  'Terry Rayon Suiting',
  'Cambric Cotton 60s',
  'Spun Denim 13.5oz',
];

export const FASHION_OCCASIONS = [
  'Bridal & Trousseau',
  'Wedding & Reception',
  'Festive & Ceremonial',
  'Evening Gala & Party',
  'Executive & Office Formal',
  'Cocktail & Designer Showcase',
  'Casual Luxury & Daily Elegance',
];

export const ALL_FASHION_CATEGORIES: FashionCategoryItem[] = [
  // 1. Formal & Western Wear
  { department: 'Formal & Western Wear', category: 'Formal Suits', code: 'SUT-FRM', description: 'Two-piece and three-piece executive business suits', defaultUnit: 'pcs', commonFabrics: ['Italian Wool Blend', 'Terry Rayon Suiting'] },
  { department: 'Formal & Western Wear', category: 'Coat and Pant Sets', code: 'SET-CP', description: 'Coordinated formal coat and trouser sets', defaultUnit: 'pcs', commonFabrics: ['Poly-Viscose', 'Wool Blend'] },
  { department: 'Formal & Western Wear', category: 'Blazers', code: 'BLZ', description: 'Tailored casual, party, and structured blazers', defaultUnit: 'pcs', commonFabrics: ['Italian Wool Blend', 'Micro Velvet 9000', 'Linen Blend'] },
  { department: 'Formal & Western Wear', category: 'Formal Shirts', code: 'SHT-FRM', description: 'Executive oxford and spread collar shirts', defaultUnit: 'pcs', commonFabrics: ['100% Giza Cotton', 'Pure Linen'] },
  { department: 'Formal & Western Wear', category: 'Casual Shirts', code: 'SHT-CSL', description: 'Printed, washed, and casual cotton shirts', defaultUnit: 'pcs', commonFabrics: ['100% Giza Cotton', 'Cambric Cotton 60s'] },
  { department: 'Formal & Western Wear', category: 'T-Shirts', code: 'TEE', description: 'Piqué polos and combed round neck t-shirts', defaultUnit: 'pcs', commonFabrics: ['100% Giza Cotton'] },
  { department: 'Formal & Western Wear', category: 'Trousers and Formal Pants', code: 'TRS-FRM', description: 'Formal pleated and flat-front trousers', defaultUnit: 'pcs', commonFabrics: ['Terry Rayon Suiting', 'Poly-Viscose'] },
  { department: 'Formal & Western Wear', category: 'Waistcoats', code: 'WST', description: 'Formal three-piece and Nehru waistcoats', defaultUnit: 'pcs', commonFabrics: ['Raw Silk', 'Wool Blend', 'Brocade'] },
  { department: 'Formal & Western Wear', category: 'Office Wear', code: 'OFC-WR', description: 'Coordinated everyday corporate apparel', defaultUnit: 'pcs', commonFabrics: ['Cotton Blend', 'Crepe'] },

  // 2. Women’s Ethnic Wear
  { department: 'Women’s Ethnic Wear', category: 'Kurta and Kurti', code: 'KRT', description: 'Designer kurtis, straight cut and A-line cuts', defaultUnit: 'pcs', commonFabrics: ['Cambric Cotton 60s', 'Chanderi Silk', 'Rayon'] },
  { department: 'Women’s Ethnic Wear', category: 'Kurta Sets', code: 'KRT-SET', description: 'Kurta with pants/palazzo and dupatta set', defaultUnit: 'pcs', commonFabrics: ['Pure Chiffon', 'Chanderi Silk', 'Cotton'] },
  { department: 'Women’s Ethnic Wear', category: 'Salwar Suits', code: 'SLW-SUT', description: 'Traditional Patiala and Punjabi salwar suits', defaultUnit: 'pcs', commonFabrics: ['Georgette with Resham Work', 'Cotton'] },
  { department: 'Women’s Ethnic Wear', category: 'Anarkali Suits', code: 'ANR-SUT', description: 'Flared floor-length royal Anarkali sets', defaultUnit: 'pcs', commonFabrics: ['Pure Mulberry Silk', 'Georgette', 'Net'] },
  { department: 'Women’s Ethnic Wear', category: 'Sarees', code: 'SAR', description: 'Daily wear, festive, and printed sarees', defaultUnit: 'pcs', commonFabrics: ['Pure Chiffon', 'Georgette', 'Cotton Silk'] },
  { department: 'Women’s Ethnic Wear', category: 'Premium Sarees', code: 'SAR-PRM', description: 'Handcrafted premium weave sarees', defaultUnit: 'pcs', commonFabrics: ['Banarasi Katan Silk', 'Kanjivaram Silk'] },
  { department: 'Women’s Ethnic Wear', category: 'Designer Sarees', code: 'SAR-DSG', description: 'Contemporary sequence, cutwork, and pre-draped sarees', defaultUnit: 'pcs', commonFabrics: ['Georgette with Resham Work', 'Net'] },
  { department: 'Women’s Ethnic Wear', category: 'Bridal Sarees', code: 'SAR-BDL', description: 'Heavy zardozi and real zari wedding bridal sarees', defaultUnit: 'pcs', commonFabrics: ['Banarasi Katan Silk', 'Raw Silk'] },
  { department: 'Women’s Ethnic Wear', category: 'Lehenga', code: 'LHG', description: 'Festive flare lehenga choli ensembles', defaultUnit: 'pcs', commonFabrics: ['Micro Velvet 9000', 'Raw Silk', 'Georgette'] },
  { department: 'Women’s Ethnic Wear', category: 'Premium Lehenga', code: 'LHG-PRM', description: 'Hand-embroidered designer party lehengas', defaultUnit: 'pcs', commonFabrics: ['Pure Mulberry Silk', 'Micro Velvet 9000'] },
  { department: 'Women’s Ethnic Wear', category: 'Bridal Lehenga', code: 'LHG-BDL', description: 'Couture bridal lehengas with cancan and double dupatta', defaultUnit: 'pcs', commonFabrics: ['Micro Velvet 9000', 'Banarasi Brocade', 'Raw Silk'] },
  { department: 'Women’s Ethnic Wear', category: 'Chaniya Choli', code: 'CHN-CHL', description: 'Navratri and festive mirror-work chaniya cholis', defaultUnit: 'pcs', commonFabrics: ['100% Giza Cotton', 'Georgette'] },
  { department: 'Women’s Ethnic Wear', category: 'Dupatta', code: 'DPT', description: 'Banarasi, phulkari, bandhani, and organza dupattas', defaultUnit: 'pcs', commonFabrics: ['Banarasi Katan Silk', 'Pure Chiffon', 'Net'] },

  // 3. Dresses & Fashion
  { department: 'Dresses & Fashion', category: 'Party Wear Dresses', code: 'DRS-PTY', description: 'Cocktail and celebratory designer dresses', defaultUnit: 'pcs', commonFabrics: ['Duchess Satin', 'Georgette', 'Velvet'] },
  { department: 'Dresses & Fashion', category: 'Casual Dresses', code: 'DRS-CSL', description: 'Floral day dresses and summer tunics', defaultUnit: 'pcs', commonFabrics: ['100% Giza Cotton', 'Pure Linen'] },
  { department: 'Dresses & Fashion', category: 'Evening Gowns', code: 'GWN-EVN', description: 'Floor sweeping ballgowns and mermaid evening gowns', defaultUnit: 'pcs', commonFabrics: ['Duchess Satin', 'Heavy Net with Zari Work'] },
  { department: 'Dresses & Fashion', category: 'Maxi Dresses', code: 'DRS-MAX', description: 'Bohemian and flowy tiered maxi dresses', defaultUnit: 'pcs', commonFabrics: ['Georgette', 'Pure Chiffon'] },
  { department: 'Dresses & Fashion', category: 'Designer Wear', code: 'DSG-WR', description: 'Exclusive runway fashion and haute couture creations', defaultUnit: 'pcs', commonFabrics: ['Pure Mulberry Silk', 'Organza'] },
  { department: 'Dresses & Fashion', category: 'Festive Wear', code: 'FST-WR', description: 'Indo-western festive coordinates and cape sets', defaultUnit: 'pcs', commonFabrics: ['Chanderi Silk', 'Georgette'] },
  { department: 'Dresses & Fashion', category: 'Wedding Wear', code: 'WDG-WR', description: 'Sangeet, mehendi, and reception outfits', defaultUnit: 'pcs', commonFabrics: ['Micro Velvet 9000', 'Raw Silk'] },

  // 4. Men’s Traditional Wear
  { department: 'Men’s Traditional Wear', category: 'Kurta Pajama', code: 'M-KRT-PJM', description: 'Traditional churidar and dhoti kurta sets', defaultUnit: 'pcs', commonFabrics: ['Pure Linen', '100% Giza Cotton', 'Chanderi'] },
  { department: 'Men’s Traditional Wear', category: 'Sherwani', code: 'M-SHR', description: 'Royal groom sherwanis with royal crest buttons', defaultUnit: 'pcs', commonFabrics: ['Banarasi Brocade', 'Raw Silk', 'Velvet'] },
  { department: 'Men’s Traditional Wear', category: 'Indo-Western Wear', code: 'M-INW', description: 'Asymmetrical cuts, Jodhpuris, and achkans', defaultUnit: 'pcs', commonFabrics: ['Italian Wool Blend', 'Raw Silk'] },
  { department: 'Men’s Traditional Wear', category: 'Nehru Jackets', code: 'M-NHR-JKT', description: 'Mandarin collar sleeveless jackets (Modi coat)', defaultUnit: 'pcs', commonFabrics: ['Pure Linen', 'Tussar Silk', 'Tweed'] },
  { department: 'Men’s Traditional Wear', category: 'Wedding and Festive Wear', code: 'M-WDG-FST', description: 'Barat and celebratory ethnic attire for groomsmen', defaultUnit: 'pcs', commonFabrics: ['Banarasi Katan Silk', 'Raw Silk'] },

  // 5. Textiles & Fabrics
  { department: 'Textiles & Fabrics', category: 'Cotton', code: 'FAB-COT', description: 'Pure cotton fabric rolls by the metre', defaultUnit: 'metres', commonFabrics: ['100% Giza Cotton', 'Cambric Cotton 60s'] },
  { department: 'Textiles & Fabrics', category: 'Silk', code: 'FAB-SLK', description: 'Mulberry, Tussar, and raw silk yardage', defaultUnit: 'metres', commonFabrics: ['Pure Mulberry Silk', 'Raw Silk / Tussar'] },
  { department: 'Textiles & Fabrics', category: 'Satin', code: 'FAB-STN', description: 'High-gloss Duchess and bridal satin', defaultUnit: 'metres', commonFabrics: ['Duchess Satin'] },
  { department: 'Textiles & Fabrics', category: 'Linen', code: 'FAB-LIN', description: 'Pure European and Irish flax linen fabric', defaultUnit: 'metres', commonFabrics: ['Pure Linen'] },
  { department: 'Textiles & Fabrics', category: 'Georgette', code: 'FAB-GEO', description: 'Pure viscose 60-gram and 80-gram georgette', defaultUnit: 'metres', commonFabrics: ['Georgette with Resham Work'] },
  { department: 'Textiles & Fabrics', category: 'Chiffon', code: 'FAB-CHF', description: 'Lightweight sheer chiffon fabric bolts', defaultUnit: 'metres', commonFabrics: ['Pure Chiffon'] },
  { department: 'Textiles & Fabrics', category: 'Velvet', code: 'FAB-VLV', description: 'Micro-velvet 9000 for bridal wear', defaultUnit: 'metres', commonFabrics: ['Micro Velvet 9000'] },
  { department: 'Textiles & Fabrics', category: 'Net Fabric', code: 'FAB-NET', description: 'Soft flare net and butterfly net yardage', defaultUnit: 'metres', commonFabrics: ['Heavy Net with Zari Work'] },
  { department: 'Textiles & Fabrics', category: 'Embroidered Fabric', code: 'FAB-EMB', description: 'All-over sequins, thread, and cutwork fabrics', defaultUnit: 'metres', commonFabrics: ['Georgette with Resham Work'] },
  { department: 'Textiles & Fabrics', category: 'Printed Fabric', code: 'FAB-PRN', description: 'Digital and screen printed textile bolts', defaultUnit: 'metres', commonFabrics: ['100% Giza Cotton', 'Chiffon'] },
  { department: 'Textiles & Fabrics', category: 'Suit Material', code: 'FAB-SUT', description: 'Unstitched 3-piece salwar and formal suit cuts', defaultUnit: 'pcs', commonFabrics: ['Chanderi Silk', 'Terry Rayon Suiting'] },
  { department: 'Textiles & Fabrics', category: 'Designer Fabric', code: 'FAB-DSG', description: 'Exclusive boutique and runway yardage', defaultUnit: 'metres', commonFabrics: ['Pure Mulberry Silk', 'Organza'] },
  { department: 'Textiles & Fabrics', category: 'Bridal Fabric', code: 'FAB-BDL', description: 'Heavy zardozi, badla, and bridal brocades', defaultUnit: 'metres', commonFabrics: ['Banarasi Brocade', 'Micro Velvet 9000'] },
];
