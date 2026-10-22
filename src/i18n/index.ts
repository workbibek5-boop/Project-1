/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SupportedLanguage = 'en' | 'ne';

export interface TranslationDictionary {
  brandTitle: string;
  temporaryDisplayName: string;
  tagline: string;
  nav: {
    home: string;
    catalogue: string;
    about: string;
    announcements: string;
    futurePlans: string;
    contact: string;
    login: string;
    register: string;
    dashboard: string;
    myOrders: string;
    cart: string;
    logout: string;
  };
  common: {
    currency: string;
    currencySymbol: string;
    category: string;
    orderLimit: string;
    stock: string;
    inStock: string;
    outOfStock: string;
    viewDetails: string;
    addToCart: string;
    quantityPacks: string;
    moqLabel: string;
    subtotal: string;
    vat: string;
    total: string;
    status: string;
    action: string;
    search: string;
    filter: string;
    save: string;
    cancel: string;
    submit: string;
    approved: string;
    pending: string;
    rejected: string;
    viewInvoice: string;
    trackDispatch: string;
    remainingLimit: string;
    limitExceeded: string;
  };
  roles: Record<string, string>;
  categories: {
    C: string;
    B: string;
    F: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    brandTitle: 'Wholesale Business Management System',
    temporaryDisplayName: 'My Wholesale Business',
    tagline: 'Premium Garment & Apparel Wholesale Distribution in Nepal',
    nav: {
      home: 'Home',
      catalogue: 'Product Catalogue',
      about: 'About Company',
      announcements: 'Announcements',
      futurePlans: 'Upcoming Plans',
      contact: 'Contact Us',
      login: 'Customer Login',
      register: 'Register Business',
      dashboard: 'Office Dashboard',
      myOrders: 'My Orders',
      cart: 'Cart',
      logout: 'Sign Out',
    },
    common: {
      currency: 'NPR',
      currencySymbol: 'रू',
      category: 'Category',
      orderLimit: 'Tiered Order Limit',
      stock: 'Available Stock',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      viewDetails: 'View Details',
      addToCart: 'Add to Wholesale Cart',
      quantityPacks: 'Packs (10 pcs/pack)',
      moqLabel: 'Min. Order Quantity (MOQ)',
      subtotal: 'Subtotal',
      vat: 'VAT (13%)',
      total: 'Grand Total',
      status: 'Status',
      action: 'Action',
      search: 'Search by SKU, product name, or fabric...',
      filter: 'Filter',
      save: 'Save Changes',
      cancel: 'Cancel',
      submit: 'Submit Order',
      approved: 'Approved',
      pending: 'Under Review',
      rejected: 'Rejected',
      viewInvoice: 'View Tax Invoice',
      trackDispatch: 'Dispatch Status',
      remainingLimit: 'Remaining Allowable Credit Limit',
      limitExceeded: 'Order exceeds your category maximum limit',
    },
    roles: {
      owner: 'Owner / Executive',
      admin: 'Operations Administrator',
      inventory_manager: 'Warehouse & Stock Manager',
      sales_staff: 'Sales & Client Desk',
      accounts_staff: 'Finance & Invoicing',
      dispatch_staff: 'Logistics & Cargo',
      customer: 'Registered Wholesale Buyer',
    },
    categories: {
      C: 'Tier C Wholesale (Limit: NPR 200,000)',
      B: 'Tier B Wholesale (Limit: NPR 75,000)',
      F: 'Tier F Wholesaler (Limit: NPR 35,000)',
    },
  },
  ne: {
    brandTitle: 'थोक व्यवसाय व्यवस्थापन प्रणाली',
    temporaryDisplayName: 'मेरो थोक व्यवसाय',
    tagline: 'नेपालमा उच्चस्तरीय कपडा तथा तयारी पोशाक थोक वितरण',
    nav: {
      home: 'गृहपृष्ठ',
      catalogue: 'उत्पादन क्याटलग',
      about: 'हाम्रो बारेमा',
      announcements: 'सूचना तथा समाचार',
      futurePlans: 'भावी योजनाहरू',
      contact: 'सम्पर्क',
      login: 'ग्राहक लगइन',
      register: 'व्यवसाय दर्ता',
      dashboard: 'कार्यालय ड्यासबोर्ड',
      myOrders: 'मेरो अर्डरहरू',
      cart: 'झोला',
      logout: 'बाहिरिनुहोस्',
    },
    common: {
      currency: 'ने.रू.',
      currencySymbol: 'रू',
      category: 'श्रेणी',
      orderLimit: 'अधिकतम अर्डर सीमा',
      stock: 'उपलब्ध मौज्दात',
      inStock: 'मौज्दात उपलब्ध',
      outOfStock: 'मौज्दात सकियो',
      viewDetails: 'विवरण हेर्नुहोस्',
      addToCart: 'झोलामा थप्नुहोस्',
      quantityPacks: 'प्याकेट (१० थान/प्याक)',
      moqLabel: 'न्यूनतम अर्डर परिमाण',
      subtotal: 'उप-जम्मा',
      vat: 'मूल्य अभिवृद्धि कर (१३%)',
      total: 'कुल जम्मा',
      status: 'अवस्था',
      action: 'कार्य',
      search: 'एसकेयू, उत्पादन वा कपडा खोज्नुहोस्...',
      filter: 'छान्नुहोस्',
      save: 'सुरक्षित गर्नुहोस्',
      cancel: 'रद्द गर्नुहोस्',
      submit: 'अर्डर पेश गर्नुहोस्',
      approved: 'स्वीकृत',
      pending: 'पुनरावलोकनमा',
      rejected: 'अस्वीकृत',
      viewInvoice: 'कर बीजक हेर्नुहोस्',
      trackDispatch: 'ढुवानी अवस्था',
      remainingLimit: 'बाँकी अर्डर सीमा रकम',
      limitExceeded: 'अर्डर रकम तपाईंको श्रेणीको अधिकतम सीमाभन्दा बढी छ',
    },
    roles: {
      owner: 'मालिक / मुख्य संचालक',
      admin: 'प्रशासक',
      inventory_manager: 'गोदाम तथा मौज्दात प्रबन्धक',
      sales_staff: 'बिक्री प्रतिनिधि',
      accounts_staff: 'लेखा तथा बिलिङ',
      dispatch_staff: 'ढुवानी तथा पार्सल',
      customer: 'दर्ता थोक खरिदकर्ता',
    },
    categories: {
      C: 'श्रेणी C थोक (सीमा: रु. २००,०००)',
      B: 'श्रेणी B थोक (सीमा: रु. ७५,०००)',
      F: 'श्रेणी F थोक (सीमा: रु. ३५,०००)',
    },
  },
};

export function formatNpr(amount: number): string {
  return `NPR ${amount.toLocaleString('en-IN')}`;
}

export function formatNprNepali(amount: number): string {
  return `रू ${amount.toLocaleString('en-IN')}`;
}
