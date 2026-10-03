const PROVINCES = ['Badakhshan','Badghis','Baghlan','Balkh','Bamyan','Daykundi','Farah','Faryab','Ghazni','Ghor','Helmand','Herat','Jowzjan','Kabul','Kandahar','Kapisa','Khost','Kunar','Kunduz','Laghman','Logar','Nangarhar','Nimroz','Nuristan','Paktia','Paktika','Panjshir','Parwan','Samangan','Sar-e Pol','Takhar','Uruzgan','Wardak','Zabul'];

function normalizeProvince(value) {
  return PROVINCES.find((province) => province.toLowerCase() === String(value || '').trim().toLowerCase()) || null;
}

function deliveryFee(province) {
  return province === 'Kandahar' ? 0 : 150;
}

module.exports = { PROVINCES, normalizeProvince, deliveryFee };
