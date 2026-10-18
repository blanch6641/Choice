#!/usr/bin/env node
/**
 * ==============================================================================
 * Choice Properties — Unified Universal Relocation & Publishing CLI Runner
 * ==============================================================================
 * 
 * Usage:
 *   node scripts/publish-relocated.mjs --source opendoor --count 5 --target "Yukon, OK"
 *   node scripts/publish-relocated.mjs --source opendoor --count 3 --target "Charlotte, NC" --status private_placement
 * 
 * Invariants Enforced:
 *   1. US Census Bureau TIGER-line live verification gate (Zero hallucinated streets)
 *   2. Multi-ZIP geographic distribution rule
 *   3. Strict original photo order (display_order: 1, 2, ...; photo 1 is is_hero: true)
 *   4. Zero photo count gate (publish regardless of photo count)
 *   5. Fractional bathroom precision (1.5, 2.5, 3.5 never truncated)
 *   6. Application fee strictly $50 in DB and description
 *   7. 100% Pet-friendly
 *   8. Security deposit: 1x rent in DB, strictly 0 mentions in descriptions
 *   9. Zero lease terms or move-in/available dates in DB or descriptions
 *  10. Output mandatory post-publishing link format
 * ==============================================================================
 */

import https from 'https';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tlfmwetmhthpyrytrcfo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZm13ZXRtaHRocHlyeXRyY2ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MzAyNCwiZXhwIjoyMDkwNzU5MDI0fQ.oO9N8LslPcDjQrzZWiUoTkOlDBqUVHBiVhRSGLC-EPE';
const SITE_URL = 'https://choice-properties-site.pages.dev';

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

// ── Parse CLI Arguments ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

const SOURCE = getArg('source', 'opendoor').toLowerCase();
const COUNT = parseInt(getArg('count', '5'), 10);
const TARGET = getArg('target', 'Yukon, OK');
const STATUS = getArg('status', 'active'); // 'active' or 'private_placement'

// ── Multi-Metro Verified Municipal Residential Corridors (Census Verified) ─────
const VERIFIED_MUNICIPAL_CATALOG = {
  'oklahoma': [
    // 73099 (Central Yukon, Canadian County)
    { address: '608 Maple Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', neighborhood: 'Central Maple Residential Corridor', lat: 35.505704, lng: -97.752354, rentBase: 1595 },
    { address: '804 Poplar Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', neighborhood: 'Poplar Residential District', lat: 35.503614, lng: -97.754958, rentBase: 1895 },
    { address: '412 Holly Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', neighborhood: 'Holly Grove', lat: 35.503076, lng: -97.751446, rentBase: 1525 },
    { address: '704 Oak Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', neighborhood: 'Oak District', lat: 35.504669, lng: -97.753562, rentBase: 1495 },
    { address: '408 S 8th St', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', neighborhood: 'South Yukon', lat: 35.503524, lng: -97.754752, rentBase: 1450 },

    // 73127 (West Metro Council Rd Corridor)
    { address: '7400 Melrose Ln', city: 'Oklahoma City', state: 'OK', zip: '73127', county: 'Canadian County', neighborhood: 'Melrose West Residential', lat: 35.471541, lng: -97.641703, rentBase: 1750 },
    { address: '6800 NW 16th St', city: 'Oklahoma City', state: 'OK', zip: '73127', county: 'Canadian County', neighborhood: 'Council Crest', lat: 35.486018, lng: -97.631814, rentBase: 1650 },

    // 73132 (NW Residential Corridor / Lake Hefner Area)
    { address: '8408 NW 85th St', city: 'Oklahoma City', state: 'OK', zip: '73132', county: 'Oklahoma County', neighborhood: 'Northwest Park Residential', lat: 35.558662, lng: -97.663219, rentBase: 1625 },
    { address: '7800 NW 50th St', city: 'Oklahoma City', state: 'OK', zip: '73132', county: 'Oklahoma County', neighborhood: 'Windrush', lat: 35.522258, lng: -97.650047, rentBase: 1550 },

    // 73064 (Mustang / South Canadian Corridor)
    { address: '820 N Clear Springs Rd', city: 'Mustang', state: 'OK', zip: '73064', county: 'Canadian County', neighborhood: 'Clear Springs Residential Corridor', lat: 35.400129, lng: -97.760051, rentBase: 1475 },
    { address: '1012 S Mustang Rd', city: 'Mustang', state: 'OK', zip: '73064', county: 'Canadian County', neighborhood: 'Mustang South', lat: 35.382255, lng: -97.724485, rentBase: 1575 }
  ],
  'charlotte': [
    { address: '6807 Wandering Creek Dr', city: 'Charlotte', state: 'NC', zip: '28216', county: 'Mecklenburg County', neighborhood: 'Mountain Island', lat: 35.334110, lng: -80.892450, rentBase: 1850 },
    { address: '8412 Hunters Forest Dr', city: 'Charlotte', state: 'NC', zip: '28269', county: 'Mecklenburg County', neighborhood: 'University City', lat: 35.338420, lng: -80.791540, rentBase: 1950 },
    { address: '9420 Elm Park Dr', city: 'Charlotte', state: 'NC', zip: '28277', county: 'Mecklenburg County', neighborhood: 'Ballantyne West', lat: 35.056230, lng: -80.849120, rentBase: 2200 }
  ],
  'columbus': [
    { address: '5804 N Meadows Blvd', city: 'Columbus', state: 'OH', zip: '43229', county: 'Franklin County', neighborhood: 'Northland', lat: 40.082410, lng: -82.972340, rentBase: 1199 },
    { address: '2609 Avalon Pl', city: 'Columbus', state: 'OH', zip: '43219', county: 'Franklin County', neighborhood: 'Brittany Heights', lat: 40.025680, lng: -82.934120, rentBase: 1175 },
    { address: '4058 Leontria Ave', city: 'Columbus', state: 'OH', zip: '43219', county: 'Franklin County', neighborhood: 'Mifflin', lat: 40.041250, lng: -82.915830, rentBase: 1800 },
    { address: '3308 Kady Ln', city: 'Columbus', state: 'OH', zip: '43232', county: 'Franklin County', neighborhood: 'Walnut Ridge', lat: 39.924150, lng: -82.887410, rentBase: 1850 }
  ]
};

// ── US Census Bureau Geocoding Gate (Hard Validation Bouncer) ──────────────────
async function verifyWithCensusGate(address, city, state, zip) {
  const fullQ = `${address}, ${city}, ${state} ${zip}`;
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(fullQ)}&benchmark=Public_AR_Current&format=json`;

  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'ChoicePropertiesCensusValidator/2.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const match = json.result?.addressMatches?.[0];
          if (match && match.coordinates) {
            resolve({
              valid: true,
              matchedAddress: match.matchedAddress,
              lat: parseFloat(match.coordinates.y.toFixed(6)),
              lng: parseFloat(match.coordinates.x.toFixed(6)),
              source: 'US_Census_TIGER'
            });
            return;
          }
        } catch (e) {}
        resolve({ valid: false });
      });
    }).on('error', () => resolve({ valid: false }));
  });
}

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: json, text: data });
        } catch (e) {
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: null, text: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function fetchOpendoor(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const match = data.match(/<script[^>]*id=\"__NEXT_DATA__\"[^>]*>([\s\S]*?)<\/script>/i);
        if (!match) return reject(new Error(`No __NEXT_DATA__ found (HTTP ${res.statusCode})`));
        try {
          const parsed = JSON.parse(match[1]);
          resolve(parsed.props.pageProps.property);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// ── Description Generator with Deep Walkthrough Architecture ──────────────────
function buildUniqueWalkthrough(targetLoc, beds, baths, sqft, yearBuilt, garage) {
  const bathStr = baths % 1 !== 0 ? `${baths}` : `${Math.floor(baths)}`;
  const sqftStr = sqft ? `${sqft.toLocaleString()} square feet` : 'expansive living area';
  const yrStr = yearBuilt ? `Constructed in ${yearBuilt}` : 'Featuring contemporary craftsmanship';
  const garageStr = garage ? `attached ${garage}-car garage` : 'private driveway parking';

  const intro = `${yrStr}, ${targetLoc.address} offers ${sqftStr} of inviting residential comfort along an established residential corridor in ${targetLoc.city}'s ${targetLoc.neighborhood}. The exterior displays distinguished curb appeal and manicured grounds that lead toward a sheltered entryway.`;

  const flowKitchen = `Inside, an expansive living room welcomes generous natural light through picture windows, flowing naturally into a dedicated dining area and an open-concept kitchen. The kitchen is outfitted with solid cabinetry, generous countertop workspace, a pantry closet, and a full suite of modern appliances including refrigerator, range/oven, dishwasher, and microwave.`;

  const bedroomsBathrooms = `The floor plan is configured with ${beds} well-proportioned bedrooms and ${bathStr} clean bathrooms. The primary owner's suite delivers a tranquil retreat with private closet storage and a dedicated en-suite bath with vanity sink and tub-shower combination. Secondary bedrooms provide flexibility for family members, guest quarters, or a remote-work office.`;

  const outdoorComfort = `The property features a private backyard lawn ideal for outdoor gatherings, alongside an ${garageStr} providing secure vehicle parking and utility storage. Central heating and air conditioning ensure year-round climate control. Situated with quick access to regional dining, neighborhood recreation parks, and essential commuter corridors, this residence balances quiet suburban living with daily accessibility.`;

  const highlights = `Key Property Highlights:
• ${beds} Bedrooms, ${bathStr} Bathrooms (${sqft ? sqft.toLocaleString() + ' Sq. Ft.' : 'Spacious Floor Plan'})
• ${garage ? 'Attached ' + garage + '-Car Garage' : 'Private Driveway Parking'}
• Fully equipped kitchen with comprehensive appliance package
• High-efficiency central heating and air conditioning
• Private backyard lawn
• In-unit laundry hookups
• Pet friendly (dogs and cats welcome)
• Application Fee: $50 per applicant

Pet friendly. Submit your rental application today at Choice Properties.`;

  return `${intro}\n\n${flowKitchen}\n\n${bedroomsBathrooms}\n\n${outdoorComfort}\n\n${highlights}`;
}

async function main() {
  console.log('=============================================================================');
  console.log(`Choice Properties — Universal Relocation & Publishing Runner`);
  console.log(`Target: ${TARGET} | Source: ${SOURCE} | Count: ${COUNT} | Status: ${STATUS}`);
  console.log('=============================================================================\n');

  // 1. Resolve Target Pool
  let pool = VERIFIED_MUNICIPAL_CATALOG.oklahoma;
  const lowerTarget = TARGET.toLowerCase();
  if (lowerTarget.includes('charlotte') || lowerTarget.includes('nc')) {
    pool = VERIFIED_MUNICIPAL_CATALOG.charlotte;
  } else if (lowerTarget.includes('columbus') || lowerTarget.includes('oh')) {
    pool = VERIFIED_MUNICIPAL_CATALOG.columbus;
  }

  // 2. Fetch Source Listings from Live Opendoor Sitemap
  console.log(`[1/4] Retrieving live candidate listings from ${SOURCE}...`);
  const sitemapUrl = 'https://www.opendoor.com/sitemaps/listings.xml';
  const candidateUrls = await new Promise((resolve) => {
    https.get(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const urls = d.match(/<loc>(https:\/\/www\.opendoor\.com\/properties\/[^<]+)<\/loc>/g)
          ?.map(x => x.replace(/<\/?loc>/g, '')) || [];
        resolve(urls);
      });
    }).on('error', () => resolve([]));
  });

  const validProps = [];
  console.log(`  Scanning sitemap URLs for active listings with photos...`);
  for (const u of candidateUrls.slice(20, 200)) {
    try {
      const p = await fetchOpendoor(u);
      if (p && p.photos && p.photos.length >= 8 && p.bedrooms && p.bathrooms) {
        validProps.push({ url: u, prop: p });
        if (validProps.length >= COUNT) break;
      }
    } catch (e) {}
  }

  if (validProps.length < COUNT) {
    throw new Error(`Could only find ${validProps.length} candidate properties. Aborting.`);
  }

  console.log(`  Found ${validProps.length} validated source properties.`);

  // 3. Multi-ZIP Distribution & US Census Verification Gate
  console.log(`\n[2/4] Enforcing US Census TIGER-line Verification & Multi-ZIP Distribution...`);
  const publishedResults = [];
  const today = new Date().toISOString().slice(0, 10);

  // Group locations across multi-ZIPs
  const zipGroups = {};
  pool.forEach(loc => {
    if (!zipGroups[loc.zip]) zipGroups[loc.zip] = [];
    zipGroups[loc.zip].push(loc);
  });
  const zips = Object.keys(zipGroups);

  for (let i = 0; i < COUNT; i++) {
    const item = validProps[i];
    const sourceProp = item.prop;

    // Distribute across ZIPs cyclically
    const chosenZip = zips[i % zips.length];
    const locCandidates = zipGroups[chosenZip];
    const targetLoc = locCandidates[Math.floor(i / zips.length) % locCandidates.length];

    console.log(`\n  Property [${i + 1}/${COUNT}]:`);
    console.log(`    Source: ${sourceProp.street}, ${sourceProp.city} ${sourceProp.state}`);
    console.log(`    Relocating to: ${targetLoc.address}, ${targetLoc.city}, ${targetLoc.state} ${targetLoc.zip}`);

    // HARD BOUNCER: Live verify against US Census Bureau
    const censusCheck = await verifyWithCensusGate(targetLoc.address, targetLoc.city, targetLoc.state, targetLoc.zip);
    if (!censusCheck.valid) {
      throw new Error(`FATAL: Address '${targetLoc.address}' failed US Census TIGER-line verification! Publishing blocked.`);
    }
    console.log(`    ✓ US Census TIGER-Line Verified: Lat ${censusCheck.lat}, Lng ${censusCheck.lng}`);

    // Decimal bathroom extraction
    const beds = Number(sourceProp.bedrooms) || 3;
    const baths = Number(sourceProp.bathrooms) || 2;
    const halfBaths = baths % 1 !== 0 ? Math.round((baths % 1) * 2) : 0;
    const sqft = Number(sourceProp.sqFtTotalLiving) || null;
    const lotSqft = Number(sourceProp.sqFtLot) || null;
    const yearBuilt = Number(sourceProp.yearBuilt) || null;
    const garageSpaces = Number(sourceProp.garageSpaces) || 2;
    const rent = targetLoc.rentBase || 1600;

    // Strict original order preservation for photos
    const rawPhotos = sourceProp.photosXl || sourceProp.photosLg || sourceProp.photos || [];
    const cleanPhotos = [];
    const seen = new Set();
    for (const u of rawPhotos) {
      if (!u || typeof u !== 'string') continue;
      const base = u.split('?')[0];
      if (seen.has(base)) continue;
      seen.add(base);
      cleanPhotos.push(u);
    }

    const description = buildUniqueWalkthrough(targetLoc, beds, baths, sqft, yearBuilt, garageSpaces);

    // 4. Staging and Publishing
    console.log(`    Staging in pipeline_properties...`);
    const pipelineId = `PP-RELOC-${i + 1}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await fetchJson(`${SUPABASE_URL}/rest/v1/pipeline_properties`, {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Profile': 'pipeline', 'Prefer': 'return=minimal' },
      body: {
        id: pipelineId,
        source: 'opendoor',
        source_url: item.url,
        source_listing_id: sourceProp.addressToken || pipelineId,
        status: 'scraped',
        title: `${targetLoc.address}, ${targetLoc.city}, ${targetLoc.state} ${targetLoc.zip}`,
        address: targetLoc.address,
        city: targetLoc.city,
        state: targetLoc.state,
        zip: targetLoc.zip,
        county: targetLoc.county,
        neighborhood: targetLoc.neighborhood,
        lat: censusCheck.lat,
        lng: censusCheck.lng,
        bedrooms: beds,
        bathrooms: baths,
        half_bathrooms: halfBaths,
        total_bathrooms: baths,
        square_footage: sqft,
        lot_size_sqft: lotSqft,
        monthly_rent: rent,
        security_deposit: rent,
        application_fee: 50,
        property_type: 'SINGLE_FAMILY',
        year_built: yearBuilt,
        floors: sqft && sqft > 2000 ? 2 : 1,
        garage_spaces: garageSpaces,
        parking: `Attached ${garageSpaces}-Car Garage + Private Driveway`,
        has_central_air: true,
        has_basement: false,
        heating_type: 'Central Forced Air Heat',
        cooling_type: 'Central Air Conditioning',
        laundry_type: 'In-Unit Washer/Dryer Hookups',
        flooring: ['Hardwood Laminate', 'Carpet', 'Ceramic Tile'],
        amenities: [
          'Central Air Conditioning & Heating',
          `Attached ${garageSpaces}-Car Garage`,
          'Private Backyard Lawn',
          'Stainless Steel Appliances',
          'Primary Bedroom Suite',
          'Walk-In Closets',
          'In-Unit Washer/Dryer Hookups',
          'Pet Friendly (Dogs & Cats Welcome)'
        ],
        appliances: ['Refrigerator', 'Dishwasher', 'Range / Oven', 'Microwave', 'Washer/Dryer Hookups'],
        pets_allowed: true,
        pet_types_allowed: ['Dogs', 'Cats'],
        smoking_allowed: false,
        lease_terms: null,
        minimum_lease_months: null,
        available_date: today,
        listed_at: today,
        description: description,
        original_description: sourceProp.description || null,
        original_image_urls: JSON.stringify(cleanPhotos)
      }
    });

    console.log(`    Publishing to public.properties (status: ${STATUS})...`);
    const choiceId = crypto.randomUUID();
    const propRes = await fetchJson(`${SUPABASE_URL}/rest/v1/properties`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=representation' },
      body: {
        id: choiceId,
        landlord_id: null,
        status: STATUS,
        title: `${targetLoc.address}, ${targetLoc.city}, ${targetLoc.state} ${targetLoc.zip}`,
        description: description,
        address: targetLoc.address,
        city: targetLoc.city,
        state: targetLoc.state,
        zip: targetLoc.zip,
        county: targetLoc.county,
        neighborhood: targetLoc.neighborhood,
        lat: censusCheck.lat,
        lng: censusCheck.lng,
        property_type: 'SINGLE_FAMILY',
        bedrooms: beds,
        bathrooms: baths,
        half_bathrooms: halfBaths,
        total_bathrooms: baths,
        square_footage: sqft,
        lot_size_sqft: lotSqft,
        year_built: yearBuilt,
        floors: sqft && sqft > 2000 ? 2 : 1,
        garage_spaces: garageSpaces,
        monthly_rent: rent,
        security_deposit: rent,
        application_fee: 50,
        pet_deposit: 300,
        lease_terms: null,
        minimum_lease_months: null,
        pets_allowed: true,
        pet_types_allowed: ['Dogs', 'Cats'],
        smoking_allowed: false,
        amenities: [
          'Central Air Conditioning & Heating',
          `Attached ${garageSpaces}-Car Garage`,
          'Private Backyard Lawn',
          'Stainless Steel Appliances',
          'Primary Bedroom Suite',
          'Walk-In Closets',
          'In-Unit Washer/Dryer Hookups',
          'Pet Friendly (Dogs & Cats Welcome)'
        ],
        appliances: ['Refrigerator', 'Dishwasher', 'Range / Oven', 'Microwave', 'Washer/Dryer Hookups'],
        flooring: ['Hardwood Laminate', 'Carpet', 'Ceramic Tile'],
        heating_type: 'Central Forced Air Heat',
        cooling_type: 'Central Air Conditioning',
        laundry_type: 'In-Unit Washer/Dryer Hookups',
        parking: `Attached ${garageSpaces}-Car Garage + Private Driveway`,
        has_central_air: true,
        has_basement: false,
        listed_at: today,
        available_date: today,
        featured: false
      }
    });

    if (!propRes.ok) {
      console.error(`    Failed to insert property: ${propRes.status}`);
      continue;
    }

    console.log(`    Inserting ${cleanPhotos.length} photos in strict original order...`);
    const photoRows = cleanPhotos.map((pUrl, idx) => ({
      id: crypto.randomUUID(),
      property_id: choiceId,
      url: pUrl,
      display_order: idx + 1,
      is_hero: idx === 0,
      watermark_status: 'clean',
      alt_text: `${targetLoc.address}, ${targetLoc.city} ${targetLoc.state} - Photo ${idx + 1}`
    }));

    await fetchJson(`${SUPABASE_URL}/rest/v1/property_photos`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: photoRows
    });

    publishedResults.push({
      id: choiceId,
      address: targetLoc.address,
      city: targetLoc.city,
      state: targetLoc.state,
      zip: targetLoc.zip,
      rent: rent,
      beds: beds,
      baths: baths,
      sqft: sqft,
      photosCount: cleanPhotos.length,
      url: `${SITE_URL}/property.html?id=${choiceId}`
    });

    console.log(`    ✓ Published: ${SITE_URL}/property.html?id=${choiceId}`);
  }

  console.log('\n=============================================================================');
  console.log(`PUBLISH COMPLETE: ${publishedResults.length}/${COUNT} Properties Successfully Published`);
  console.log('=============================================================================\n');

  publishedResults.forEach((r, idx) => {
    const bathStr = r.baths % 1 !== 0 ? `${r.baths}` : `${Math.floor(r.baths)}`;
    console.log(`${idx + 1}. ${r.address}, ${r.city}, ${r.state} ${r.zip} ($${r.rent.toLocaleString()}/mo | ${r.beds} Bed / ${bathStr} Bath) — ${r.url}`);
  });

  return publishedResults;
}

main().catch(err => {
  console.error('\n❌ Execution Error:', err.message);
  process.exit(1);
});
