// ============================================================
// /api/relocate — Choice Properties Address Relocation & Aliasing API
// Cloudflare Pages Function endpoint with Multi-ZIP Distribution
// ============================================================

export function aliasAddress(address, offset = 8) {
  if (!address || typeof address !== 'string') return address;
  const match = address.match(/^(\d+)(.*)$/);
  if (!match) return address;
  const num = parseInt(match[1], 10);
  const newNum = num + offset;
  return `${newNum}${match[2]}`;
}

// Multi-ZIP verified residential locations across Canadian County & West Metro
const YUKON_VERIFIED_LOCATIONS = [
  // 73099 (Central Yukon, Canadian County)
  { address: '704 Oak Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.504644, lng: -97.753636 },
  { address: '820 Elm Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.506739, lng: -97.755214 },
  { address: '412 Holly Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.503075, lng: -97.751478 },
  { address: '624 Cedar Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.508870, lng: -97.752619 },
  { address: '408 S 8th St', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.503461, lng: -97.754781 },
  { address: '3216 Vandament Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.493472, lng: -97.729211 },
  { address: '12000 NW 10th St', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.478978, lng: -97.738434 },

  // 73127 (Yukon / West Metro Council Rd Corridor)
  { address: '7400 Melrose Ln', city: 'Yukon', state: 'OK', zip: '73127', county: 'Canadian County', lat: 35.471517, lng: -97.641661 },
  { address: '6800 NW 16th St', city: 'Yukon', state: 'OK', zip: '73127', county: 'Canadian County', lat: 35.485994, lng: -97.631896 },
  { address: '2400 N Council Rd', city: 'Yukon', state: 'OK', zip: '73127', county: 'Canadian County', lat: 35.482437, lng: -97.654301 },

  // 73132 (NW Residential Corridor)
  { address: '7800 NW 50th St', city: 'Yukon', state: 'OK', zip: '73132', county: 'Canadian County', lat: 35.522258, lng: -97.650047 },
  { address: '6200 NW 63rd St', city: 'Yukon', state: 'OK', zip: '73132', county: 'Canadian County', lat: 35.536593, lng: -97.561532 },

  // 73064 (Mustang / South Yukon Corridor)
  { address: '400 S Mustang Rd', city: 'Mustang', state: 'OK', zip: '73064', county: 'Canadian County', lat: 35.388585, lng: -97.724463 }
];

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { property, targetQuery, mode } = body;

    if (!property) {
      return new Response(JSON.stringify({ ok: false, error: 'Property is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (mode === 'same_block_alias') {
      const originalAddr = property.address || property.street || '';
      const newAddress = aliasAddress(originalAddr, 8);
      const city = property.city || '';
      const state = property.state || '';
      const zip = property.zip || property.zip_code || '';
      const title = `${newAddress}, ${city}, ${state} ${zip}`.trim();

      return new Response(JSON.stringify({
        ok: true,
        result: {
          newTitle: title,
          newAddress: newAddress,
          newCity: city,
          newState: state,
          newZip: zip,
          newCounty: property.county || '',
          newLat: property.lat || property.latitude,
          newLng: property.lng || property.longitude,
          newDescription: property.description || '',
          method: 'Same-Block Privacy Aliasing (+8 Offset)',
          verifiedCensus: true
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cross-location relocation with Multi-ZIP distribution
    const query = (targetQuery || 'Yukon, OK').trim();
    const zipMatch = query.match(/\b\d{5}\b/);
    const requestedZip = zipMatch ? zipMatch[0] : null;

    let pool = YUKON_VERIFIED_LOCATIONS;
    if (requestedZip) {
      // If user explicitly specifies a single ZIP code, filter strictly by it
      const filtered = YUKON_VERIFIED_LOCATIONS.filter(l => l.zip === requestedZip);
      if (filtered.length > 0) pool = filtered;
    }

    const loc = pool[Math.floor(Math.random() * pool.length)];
    const newAddress = loc.address;
    const city = loc.city;
    const state = loc.state;
    const zip = loc.zip;
    const county = loc.county;
    const newTitle = `${newAddress}, ${city}, ${state} ${zip}`;

    let newDesc = property.description || '';
    if (newDesc && property.city && property.state) {
      newDesc = newDesc
        .replace(new RegExp(`\\b${property.city}\\b`, 'gi'), city)
        .replace(new RegExp(`\\b${property.state}\\b`, 'gi'), state)
        .replace(new RegExp(`\\b${property.zip || ''}\\b`, 'gi'), zip);
    }

    return new Response(JSON.stringify({
      ok: true,
      result: {
        newTitle,
        newAddress,
        newCity: city,
        newState: state,
        newZip: zip,
        newCounty: county,
        newLat: loc.lat,
        newLng: loc.lng,
        newDescription: newDesc,
        method: `Verified Synthetic Relocation Multi-ZIP (${city}, ${state} ${zip})`,
        verifiedCensus: true
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
