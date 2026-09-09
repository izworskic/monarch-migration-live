const ALLOWED = new Set(['cc0', 'cc-by', 'CC0_1_0', 'CC_BY_4_0']);
export function isCommerciallyReusableLicense(value = '') {
  return ALLOWED.has(String(value).trim());
}
export function normalizeINatLicense(value = '') {
  return String(value).toLowerCase().replace(/_/g, '-');
}
