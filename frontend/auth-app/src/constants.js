export const COUNTRIES = [
  { name: "South Africa",   code: "ZA", currency: "ZAR", symbol: "R",   flag: "🇿🇦", popular: true  },
  { name: "Nigeria",        code: "NG", currency: "NGN", symbol: "₦",   flag: "🇳🇬", popular: true  },
  { name: "Kenya",          code: "KE", currency: "KES", symbol: "KSh", flag: "🇰🇪", popular: true  },
  { name: "Ghana",          code: "GH", currency: "GHS", symbol: "₵",   flag: "🇬🇭", popular: true  },
  { name: "United Kingdom", code: "GB", currency: "GBP", symbol: "£",   flag: "🇬🇧", popular: true  },
  { name: "United States",  code: "US", currency: "USD", symbol: "$",   flag: "🇺🇸", popular: true  },
  { name: "Zimbabwe",       code: "ZW", currency: "USD", symbol: "$",   flag: "🇿🇼", popular: false },
  { name: "Tanzania",       code: "TZ", currency: "TZS", symbol: "TSh", flag: "🇹🇿", popular: false },
  { name: "Uganda",         code: "UG", currency: "UGX", symbol: "USh", flag: "🇺🇬", popular: false },
  { name: "Botswana",       code: "BW", currency: "BWP", symbol: "P",   flag: "🇧🇼", popular: false },
  { name: "Namibia",        code: "NA", currency: "NAD", symbol: "N$",  flag: "🇳🇦", popular: false },
  { name: "European Union", code: "EU", currency: "EUR", symbol: "€",   flag: "🇪🇺", popular: false },
  { name: "India",          code: "IN", currency: "INR", symbol: "₹",   flag: "🇮🇳", popular: false },
  { name: "Australia",      code: "AU", currency: "AUD", symbol: "A$",  flag: "🇦🇺", popular: false },
  { name: "Canada",         code: "CA", currency: "CAD", symbol: "C$",  flag: "🇨🇦", popular: false },
  { name: "Japan",          code: "JP", currency: "JPY", symbol: "¥",   flag: "🇯🇵", popular: false },
  { name: "UAE",            code: "AE", currency: "AED", symbol: "د.إ", flag: "🇦🇪", popular: false },
];

export const POPULAR_COUNTRIES  = COUNTRIES.filter(c => c.popular);
export const ALL_OTHER_COUNTRIES = COUNTRIES.filter(c => !c.popular);