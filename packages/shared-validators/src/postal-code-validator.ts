/**
 * Validator for Spanish postal codes
 */

export interface PostalCodeValidationResult {
  isValid: boolean;
  province?: string;
  message?: string;
}

const PROVINCES: Record<string, string> = {
  "01": "Álava",
  "02": "Albacete",
  "03": "Alicante",
  "04": "Almería",
  "05": "Ávila",
  "06": "Badajoz",
  "07": "Baleares",
  "08": "Barcelona",
  "09": "Burgos",
  "10": "Cáceres",
  "11": "Cádiz",
  "12": "Castellón",
  "13": "Ciudad Real",
  "14": "Córdoba",
  "15": "A Coruña",
  "16": "Cuenca",
  "17": "Girona",
  "18": "Granada",
  "19": "Guadalajara",
  "20": "Gipuzkoa",
  "21": "Huelva",
  "22": "Huesca",
  "23": "Jaén",
  "24": "León",
  "25": "Lleida",
  "26": "La Rioja",
  "27": "Lugo",
  "28": "Madrid",
  "29": "Málaga",
  "30": "Murcia",
  "31": "Navarra",
  "32": "Ourense",
  "33": "Asturias",
  "34": "Palencia",
  "35": "Las Palmas",
  "36": "Pontevedra",
  "37": "Salamanca",
  "38": "Santa Cruz de Tenerife",
  "39": "Cantabria",
  "40": "Segovia",
  "41": "Sevilla",
  "42": "Soria",
  "43": "Tarragona",
  "44": "Teruel",
  "45": "Toledo",
  "46": "Valencia",
  "47": "Valladolid",
  "48": "Bizkaia",
  "49": "Zamora",
  "50": "Zaragoza",
  "51": "Ceuta",
  "52": "Melilla",
};

export function validatePostalCode(
  postalCode: string,
): PostalCodeValidationResult {
  if (!postalCode || typeof postalCode !== "string") {
    return { isValid: false, message: "El código postal es obligatorio" };
  }

  const cleaned = postalCode.trim().replace(/\s/g, "");

  if (!/^\d{5}$/.test(cleaned)) {
    return { isValid: false, message: "El código postal debe tener 5 dígitos" };
  }

  const provinceCode = cleaned.slice(0, 2);
  const province = PROVINCES[provinceCode];

  if (!province) {
    return { isValid: false, message: "Código de provincia no válido" };
  }

  return { isValid: true, province };
}

export function isValidPostalCode(postalCode: string): boolean {
  return validatePostalCode(postalCode).isValid;
}
