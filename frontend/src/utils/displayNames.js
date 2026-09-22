const CUSTOMER_DISPLAY_NAMES = {
  "amit verma": { en: "Amit Verma", hi: "अमित वर्मा", mr: "अमित वर्मा" },
  "अमित वर्मा": { en: "Amit Verma", hi: "अमित वर्मा", mr: "अमित वर्मा" },
  "amit kumar": { en: "Amit Kumar", hi: "अमित कुमार", mr: "अमित कुमार" },
  "अमित कुमार": { en: "Amit Kumar", hi: "अमित कुमार", mr: "अमित कुमार" },
  pratha: { en: "Pratha", hi: "प्रथा", mr: "प्रथा" },
  "प्रथा": { en: "Pratha", hi: "प्रथा", mr: "प्रथा" },
  shivam: { en: "Shivam", hi: "शिवम", mr: "शिवम" },
  "शिवम": { en: "Shivam", hi: "शिवम", mr: "शिवम" },
  siya: { en: "Siya", hi: "सिया", mr: "सिया" },
  "सिया": { en: "Siya", hi: "सिया", mr: "सिया" },
  ramesh: { en: "Ramesh", hi: "रमेश", mr: "रमेश" },
  "रमेश": { en: "Ramesh", hi: "रमेश", mr: "रमेश" },
  suraj: { en: "Suraj", hi: "सूरज", mr: "सुरज" },
  "सुरज": { en: "Suraj", hi: "सूरज", mr: "सुरज" },
  "सूरज": { en: "Suraj", hi: "सूरज", mr: "सुरज" },
};

const PRODUCT_DISPLAY_NAMES = {
  rice: { en: "Rice", hi: "चावल", mr: "तांदूळ" },
  "चावल": { en: "Rice", hi: "चावल", mr: "तांदूळ" },
  "तांदूळ": { en: "Rice", hi: "चावल", mr: "तांदूळ" },
  sugar: { en: "Sugar", hi: "चीनी", mr: "साखर" },
  "चीनी": { en: "Sugar", hi: "चीनी", mr: "साखर" },
  "साखर": { en: "Sugar", hi: "चीनी", mr: "साखर" },
  chips: { en: "Chips", hi: "चिप्स", mr: "चिप्स" },
  "चिप्स": { en: "Chips", hi: "चिप्स", mr: "चिप्स" },
};

export function displayCustomerName(name, language) {
  if (!name) return name;
  // Auto is a response-mode setting. Static UI keeps the canonical display
  // until a concrete language has been selected, avoiding mixed scripts.
  if (language === "auto") return name;
  const display = CUSTOMER_DISPLAY_NAMES[name.trim().toLowerCase()];
  return display?.[language] || name;
}

export function displayProductName(name, language) {
  if (!name) return name;
  if (language === "auto") return name;
  const display = PRODUCT_DISPLAY_NAMES[name.trim().toLowerCase()];
  return display?.[language] || name;
}
