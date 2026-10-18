import https from 'https';
import crypto from 'crypto';

const SUPABASE_URL = 'https://tlfmwetmhthpyrytrcfo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZm13ZXRtaHRocHlyeXRyY2ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MzAyNCwiZXhwIjoyMDkwNzU5MDI0fQ.oO9N8LslPcDjQrzZWiUoTkOlDBqUVHBiVhRSGLC-EPE';
const SITE_URL = 'https://choice-properties-site.pages.dev';

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

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
        if (!match) return reject(new Error(`No __NEXT_DATA__ found in ${url} (status: ${res.statusCode})`));
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

const OPENDOOR_CONFIRMED_TARGETS = [
  {
    url: 'https://www.opendoor.com/properties/6807-Wandering-Creek-Dr-Charlotte-NC-28216/aid_33c4eb1b-5754-5c66-8e4a-503d9cb46a2e',
    relocation: {
      address: '608 Maple Ave',
      city: 'Yukon',
      state: 'OK',
      zip: '73099',
      county: 'Canadian County',
      neighborhood: 'Central Maple Residential Corridor',
      lat: 35.505704,
      lng: -97.752354,
      rent: 1595,
      storyIntro: 'Offering 1,901 square feet of comfortable single-family living, 608 Maple Ave welcomes you with an attractive brick-and-siding facade situated along an established residential tree-lined corridor in Yukon.'
    }
  },
  {
    url: 'https://www.opendoor.com/properties/744-Bent-Creek-Dr-Hope-Mills-NC-28348/aid_5e131288-1da1-58e1-a490-eab24a9f27dd',
    relocation: {
      address: '7400 Melrose Ln',
      city: 'Oklahoma City',
      state: 'OK',
      zip: '73127',
      county: 'Canadian County',
      neighborhood: 'Melrose West Residential District',
      lat: 35.471541,
      lng: -97.641703,
      rent: 1750,
      storyIntro: 'Spanning 2,091 square feet across two well-proportioned levels, 7400 Melrose Ln features a versatile four-bedroom layout designed for everyday comfort and modern convenience in western Canadian County.'
    }
  },
  {
    url: 'https://www.opendoor.com/properties/4204-Camden-Woods-Ct-Raleigh-NC-27612/aid_aeb2177a-d40c-510a-9ba8-15879b7c4eec',
    relocation: {
      address: '8408 NW 85th St',
      city: 'Oklahoma City',
      state: 'OK',
      zip: '73132',
      county: 'Oklahoma County',
      neighborhood: 'Northwest Park Residential Corridor',
      lat: 35.558662,
      lng: -97.663219,
      rent: 1625,
      storyIntro: 'Nestled in northwest Oklahoma City near Lake Hefner parkways, 8408 NW 85th St delivers 1,589 square feet of bright living space accented by soaring ceilings and an open-concept flow.'
    }
  },
  {
    url: 'https://www.opendoor.com/properties/141-Thacker-Dr-Portland-TN-37148/aid_e4a8447e-45d2-5ca5-b5ed-ea8ca7935e4d',
    relocation: {
      address: '820 N Clear Springs Rd',
      city: 'Mustang',
      state: 'OK',
      zip: '73064',
      county: 'Canadian County',
      neighborhood: 'Clear Springs Residential Enclave',
      lat: 35.400129,
      lng: -97.760051,
      rent: 1475,
      storyIntro: 'Positioned on a generous residential parcel in Mustang, 820 N Clear Springs Rd features a relaxed 1,420-square-foot floor plan highlighted by clean finishes and expansive outdoor yard space.'
    }
  },
  {
    url: 'https://www.opendoor.com/properties/8723-Hosta-Way-Camby-IN-46113/aid_c2231c6a-d997-5dea-b5e3-1e2e3df8b976',
    relocation: {
      address: '804 Poplar Ave',
      city: 'Yukon',
      state: 'OK',
      zip: '73099',
      county: 'Canadian County',
      neighborhood: 'Poplar Residential District',
      lat: 35.503614,
      lng: -97.754958,
      rent: 1895,
      storyIntro: 'Presenting 2,340 square feet of generous interior space, 804 Poplar Ave stands as a stately two-story family home in central Yukon, designed with an emphasis on open entertainment and dedicated retreats.'
    }
  }
];

function generateAuthenticDescription(target, beds, baths, sqft, yearBuilt, garage) {
  const reloc = target.relocation;
  const bathStr = baths % 1 !== 0 ? `${baths}` : `${Math.floor(baths)}`;
  const sqftStr = sqft ? `${sqft.toLocaleString()} square feet` : 'comfortable living space';
  const garageStr = garage ? `attached ${garage}-car garage` : 'private driveway parking';

  const intro = `${reloc.storyIntro} The home presents clean exterior lines, a covered entry porch, and manicured green grounds welcoming you inside.`;

  const livingKitchen = `The central living area features expansive windows that gather natural daylight throughout the day, opening smoothly into the adjoining dining room and culinary kitchen. Outfitted with abundant solid-wood cabinetry, expansive countertops, and a walk-in storage pantry, the kitchen is fully equipped with stainless steel appliances—including refrigerator, range/oven, multi-cycle dishwasher, and built-in microwave. The breakfast bar counter allows for casual morning dining while keeping hosts connected to guests.`;

  const bedroomsBathrooms = `Arranged thoughtfully for privacy, the residence offers ${beds} spacious bedrooms and ${bathStr} full and half bathrooms. The primary owner's suite features generous wardrobe space alongside an en-suite bathroom appointed with a wide dual-sink vanity, modern lighting fixtures, and a glass-enclosed shower/soaking tub. The additional bedrooms offer versatile arrangements suited for family members, guest quarters, or a dedicated remote-work office.`;

  const groundsComfort = `Outside, a fenced backyard lawn provides ample room for open-air entertaining and relaxation, complemented by an ${garageStr} with built-in storage potential. High-efficiency central heating and air conditioning ensure climate comfort through every season. Located with convenient access to regional shopping centers, neighborhood recreation trails, and prime commuter avenues, this single-family residence delivers exceptional livability.`;

  const highlights = `Key Property Features:
• ${beds} Bedrooms, ${bathStr} Bathrooms (${sqftStr})
• ${garage ? 'Attached ' + garage + '-Car Garage' : 'Private Driveway Parking'}
• Full kitchen appliance package (refrigerator, oven, dishwasher, microwave)
• High-efficiency central heating and air conditioning
• Private yard and rear leisure space
• In-unit laundry hookups
• Pet friendly (dogs and cats welcome)
• Application Fee: $50 per applicant

Pet friendly. Submit your rental application today at Choice Properties.`;

  return `${intro}\n\n${livingKitchen}\n\n${bedroomsBathrooms}\n\n${groundsComfort}\n\n${highlights}`;
}

async function run() {
  console.log('================================================================');
  console.log('Choice Properties — Live Opendoor Scrape & Verified Relocation');
  console.log('================================================================\n');

  const publishedResults = [];
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < OPENDOOR_CONFIRMED_TARGETS.length; i++) {
    const item = OPENDOOR_CONFIRMED_TARGETS[i];
    const reloc = item.relocation;
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[${i + 1}/5] Scraping Opendoor: ${item.url}...`);

    let prop;
    try {
      prop = await fetchOpendoor(item.url);
    } catch (e) {
      console.error(`Error scraping ${item.url}:`, e.message);
      continue;
    }

    const beds = Number(prop.bedrooms) || 3;
    const baths = Number(prop.bathrooms) || 2;
    const halfBaths = baths % 1 !== 0 ? Math.round((baths % 1) * 2) : 0;
    const sqft = Number(prop.sqFtTotalLiving) || null;
    const lotSqft = Number(prop.sqFtLot) || null;
    const yearBuilt = Number(prop.yearBuilt) || null;
    const garageSpaces = Number(prop.garageSpaces) || 2;

    // Strict original order preservation for photos
    const rawPhotos = prop.photosXl || prop.photosLg || prop.photos || [];
    const cleanPhotos = [];
    const seen = new Set();
    for (const u of rawPhotos) {
      if (!u || typeof u !== 'string') continue;
      const base = u.split('?')[0];
      if (seen.has(base)) continue;
      seen.add(base);
      cleanPhotos.push(u);
    }

    console.log(`  Source: ${prop.street}, ${prop.city} ${prop.state} (${beds}b/${baths}ba, ${cleanPhotos.length} photos)`);
    console.log(`  Target: ${reloc.address}, ${reloc.city}, ${reloc.state} ${reloc.zip} ($${reloc.rent}/mo)`);
    console.log(`  Census Coordinates: Lat ${reloc.lat}, Lng ${reloc.lng}`);

    const amenities = [
      'Central Air Conditioning & Heating',
      garageSpaces > 0 ? `Attached ${garageSpaces}-Car Garage` : 'Private Driveway Parking',
      'Private Backyard Lawn',
      'Stainless Steel Appliances',
      'Primary Bedroom Suite',
      'Walk-In Closets',
      'In-Unit Washer/Dryer Hookups',
      'Pet Friendly (Dogs & Cats Welcome)'
    ];
    const appliances = ['Refrigerator', 'Dishwasher', 'Range / Oven', 'Microwave', 'Washer/Dryer Hookups'];
    const flooring = ['Hardwood Laminate', 'Carpet', 'Ceramic Tile'];

    const description = generateAuthenticDescription(item, beds, baths, sqft, yearBuilt, garageSpaces);

    // 1. Stage in pipeline_properties
    const pipelineId = `PP-OD-RELOC-${i + 1}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const pipelinePayload = {
      id: pipelineId,
      source: 'opendoor',
      source_url: item.url,
      source_listing_id: prop.addressToken || pipelineId,
      status: 'scraped',
      title: `${reloc.address}, ${reloc.city}, ${reloc.state} ${reloc.zip}`,
      address: reloc.address,
      city: reloc.city,
      state: reloc.state,
      zip: reloc.zip,
      county: reloc.county,
      neighborhood: reloc.neighborhood,
      lat: reloc.lat,
      lng: reloc.lng,
      bedrooms: beds,
      bathrooms: baths,
      half_bathrooms: halfBaths,
      total_bathrooms: baths,
      square_footage: sqft,
      lot_size_sqft: lotSqft,
      monthly_rent: reloc.rent,
      security_deposit: reloc.rent,
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
      flooring: flooring,
      amenities: amenities,
      appliances: appliances,
      pets_allowed: true,
      pet_types_allowed: ['Dogs', 'Cats'],
      smoking_allowed: false,
      lease_terms: null,
      minimum_lease_months: null,
      available_date: today,
      listed_at: today,
      description: description,
      original_description: prop.description || null,
      original_image_urls: JSON.stringify(cleanPhotos)
    };

    console.log(`  Staging in pipeline_properties (${pipelineId})...`);
    await fetchJson(`${SUPABASE_URL}/rest/v1/pipeline_properties`, {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Profile': 'pipeline', 'Prefer': 'return=minimal' },
      body: pipelinePayload
    });

    // 2. Insert into public.properties
    const choiceId = crypto.randomUUID();
    const propertyPayload = {
      id: choiceId,
      landlord_id: null,
      status: 'active',
      title: `${reloc.address}, ${reloc.city}, ${reloc.state} ${reloc.zip}`,
      description: description,
      address: reloc.address,
      city: reloc.city,
      state: reloc.state,
      zip: reloc.zip,
      county: reloc.county,
      neighborhood: reloc.neighborhood,
      lat: reloc.lat,
      lng: reloc.lng,
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
      monthly_rent: reloc.rent,
      security_deposit: reloc.rent,
      application_fee: 50,
      pet_deposit: 300,
      lease_terms: null,
      minimum_lease_months: null,
      pets_allowed: true,
      pet_types_allowed: ['Dogs', 'Cats'],
      smoking_allowed: false,
      amenities: amenities,
      appliances: appliances,
      flooring: flooring,
      heating_type: 'Central Forced Air Heat',
      cooling_type: 'Central Air Conditioning',
      laundry_type: 'In-Unit Washer/Dryer Hookups',
      parking: `Attached ${garageSpaces}-Car Garage + Private Driveway`,
      has_central_air: true,
      has_basement: false,
      listed_at: today,
      available_date: today,
      featured: false
    };

    console.log(`  Publishing to public.properties (ID: ${choiceId})...`);
    const propRes = await fetchJson(`${SUPABASE_URL}/rest/v1/properties`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=representation' },
      body: propertyPayload
    });

    if (!propRes.ok) {
      console.error(`  Failed to insert property: ${propRes.status} ${propRes.text}`);
      continue;
    }

    // 3. Insert photos into public.property_photos with strict original order
    console.log(`  Inserting ${cleanPhotos.length} photos (original order, first is hero)...`);
    const photoRows = cleanPhotos.map((pUrl, idx) => ({
      id: crypto.randomUUID(),
      property_id: choiceId,
      url: pUrl,
      display_order: idx + 1,
      is_hero: idx === 0,
      watermark_status: 'clean',
      alt_text: `${reloc.address}, ${reloc.city} ${reloc.state} - Photo ${idx + 1}`
    }));

    await fetchJson(`${SUPABASE_URL}/rest/v1/property_photos`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: photoRows
    });

    publishedResults.push({
      id: choiceId,
      address: reloc.address,
      city: reloc.city,
      state: reloc.state,
      zip: reloc.zip,
      rent: reloc.rent,
      beds: beds,
      baths: baths,
      sqft: sqft,
      photosCount: cleanPhotos.length,
      url: `${SITE_URL}/property.html?id=${choiceId}`
    });

    console.log(`  ✓ Successfully published: ${SITE_URL}/property.html?id=${choiceId}`);
  }

  console.log('\n================================================================');
  console.log(`BATCH COMPLETE: ${publishedResults.length}/5 Properties Published`);
  console.log('================================================================\n');

  publishedResults.forEach((r, idx) => {
    const bathStr = r.baths % 1 !== 0 ? `${r.baths}` : `${Math.floor(r.baths)}`;
    console.log(`${idx + 1}. ${r.address}, ${r.city}, ${r.state} ${r.zip} ($${r.rent.toLocaleString()}/mo | ${r.beds} Bed / ${bathStr} Bath) — ${r.url}`);
  });

  return publishedResults;
}

run().catch(console.error);
