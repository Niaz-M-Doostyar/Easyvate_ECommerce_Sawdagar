const AFGHANISTAN_PROVINCES = [
  'Badakhshan', 'Badghis', 'Baghlan', 'Balkh', 'Bamyan', 'Daykundi',
  'Farah', 'Faryab', 'Ghazni', 'Ghor', 'Helmand', 'Herat', 'Jowzjan',
  'Kabul', 'Kandahar', 'Kapisa', 'Khost', 'Kunar', 'Kunduz', 'Laghman',
  'Logar', 'Nangarhar', 'Nimroz', 'Nuristan', 'Paktika', 'Paktia',
  'Panjshir', 'Parwan', 'Samangan', 'Sar-e Pol', 'Takhar', 'Uruzgan',
  'Wardak', 'Zabul',
];

function normalizeProvince(value) {
  if (typeof value !== 'string') return null;
  const match = AFGHANISTAN_PROVINCES.find(
    (province) => province.toLowerCase() === value.trim().toLowerCase(),
  );
  return match || null;
}

module.exports = { AFGHANISTAN_PROVINCES, normalizeProvince };
