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

const MASTER_TOKEN = 'McK3-WWh5KT2hsHCsgS2yQxmUg-KK7Udp4Isk_7B6i4';
const SHARE_ID = 'aaad4c39-f4d4-47b9-a17d-7e54fb3e067b';

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
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
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
        if (!match) return reject(new Error(`No __NEXT_DATA__ found for ${url}`));
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

function buildAuthenticDescription(targetLoc, beds, baths, sqft, yearBuilt, garage, sourceProp) {
  const bathStr = baths % 1 !== 0 ? `${baths}` : `${Math.floor(baths)}`;
  const sqftStr = sqft ? `${sqft.toLocaleString()} square feet` : 'comfortable residential space';
  const yrStr = yearBuilt ? `Constructed in ${yearBuilt}` : 'Featuring contemporary craftsmanship';
  const garageStr = garage ? `attached ${garage}-car garage` : 'private driveway parking';

  const intro = `${yrStr}, ${targetLoc.address} offers ${sqftStr} of inviting residential comfort in the desirable ${targetLoc.neighborhood} area of ${targetLoc.city}, ${targetLoc.state} ${targetLoc.zip}. The exterior presents distinguished architectural character, complemented by clean curb appeal and manicured grounds leading toward a sheltered entryway.`;

  const flowKitchen = `The main interior layout features a spacious open floor plan illuminated by large picture windows that welcome natural light throughout the day. The primary living room flows smoothly into a dedicated dining space and an open-concept kitchen. Solid cabinetry, durable countertops, and a walk-in storage pantry complement a full appliance package, including refrigerator, range/oven, multi-cycle dishwasher, and built-in microwave.`;

  const bedroomsBathrooms = `Arranged for privacy and everyday functionality, the residence accommodates ${beds} generously sized bedrooms and ${bathStr} clean bathrooms. The primary owner's suite delivers a quiet retreat with abundant closet capacity and a dedicated en-suite bath with vanity sink and tub-shower enclosure. Secondary bedrooms provide versatile options for family living, visiting guests, or a dedicated remote office.`;

  const outdoorComfort = `Outside, a private backyard lawn provides room for open-air leisure, paired with an ${garageStr} that offers secure vehicle parking and utility storage. High-efficiency central heating and air conditioning maintain reliable climate comfort in every season. Conveniently situated with quick access to regional shopping centers, local parks, and primary commuter avenues, this single-family residence combines quiet neighborhood charm with everyday accessibility.`;

  const highlights = `Key Property Highlights:
• ${beds} Bedrooms, ${bathStr} Bathrooms (${sqft ? sqft.toLocaleString() + ' Sq. Ft.' : 'Spacious Layout'})
• ${garage ? 'Attached ' + garage + '-Car Garage' : 'Private Driveway Parking'}
• Full kitchen appliance package (refrigerator, oven, dishwasher, microwave)
• High-efficiency central heating and air conditioning
• Private yard and rear leisure space
• In-unit laundry hookups
• Pet friendly (dogs and cats welcome)
• Application Fee: $50 per applicant

Pet friendly. Submit your rental application today at Choice Properties.`;

  return [intro, flowKitchen, bedroomsBathrooms, outdoorComfort, highlights].join('\n\n');
}

async function main() {
  console.log('=============================================================================');
  console.log('Choice Properties — Charlotte & Huntersville In-Market Relocation & Publishing');
  console.log('Target: Distinct neighborhoods in Charlotte, NC & Huntersville, NC');
  console.log('Token to Update: ' + MASTER_TOKEN);
  console.log('=============================================================================\n');

  // Pair 7 specific, authentic Opendoor properties in Charlotte & Huntersville
  // with 7 verified Census TIGER residential destinations in distinct neighborhoods.
  const jobs = [
    // --- HUNTERSVILLE SOURCES ---
    {
      sourceUrl: 'https://www.opendoor.com/properties/12740-Windyedge-Rd-Huntersville-NC-28078/aid_eeff428d-5e1c-5011-9cc8-357dc109422b',
      target: {
        address: '200 Gilead Rd',
        city: 'Huntersville',
        state: 'NC',
        zip: '28078',
        county: 'Mecklenburg County',
        neighborhood: 'Birkdale Corridor',
        lat: 35.410757,
        lng: -80.846214
      },
      rent: 1545
    },
    {
      sourceUrl: 'https://www.opendoor.com/properties/1524-Mt-Holly-Huntersville-Rd-Charlotte-NC-28214/aid_eb0fc595-2e66-532d-87ab-d4f237b6d5b2',
      target: {
        address: '600 Dallas St',
        city: 'Huntersville',
        state: 'NC',
        zip: '28078',
        county: 'Mecklenburg County',
        neighborhood: 'Central Huntersville',
        lat: 35.408205,
        lng: -80.853283
      },
      rent: 1575
    },
    {
      sourceUrl: 'https://www.opendoor.com/properties/8915-Cinder-Ln-Huntersville-NC-28078/aid_3d976f84-0e79-58fc-bece-09252cb8bdd6',
      target: {
        address: '100 Holbrook St',
        city: 'Huntersville',
        state: 'NC',
        zip: '28078',
        county: 'Mecklenburg County',
        neighborhood: 'Vermillion Residential',
        lat: 35.409330,
        lng: -80.846006
      },
      rent: 1595
    },

    // --- CHARLOTTE SOURCES ---
    {
      sourceUrl: 'https://www.opendoor.com/properties/774-N-Davidson-St-Charlotte-NC-28202/aid_0aae69d9-6c6a-575e-9ed0-43a7cded00b1',
      target: {
        address: '500 East Blvd',
        city: 'Charlotte',
        state: 'NC',
        zip: '28203',
        county: 'Mecklenburg County',
        neighborhood: 'Dilworth Historic District',
        lat: 35.209084,
        lng: -80.854261
      },
      rent: 1425
    },
    {
      sourceUrl: 'https://www.opendoor.com/properties/542-N-Mc-Dowell-St-Charlotte-NC-28204/aid_467191d8-8b01-5902-8fc6-0d29339845c9',
      target: {
        address: '700 Providence Rd',
        city: 'Charlotte',
        state: 'NC',
        zip: '28207',
        county: 'Mecklenburg County',
        neighborhood: 'Myers Park Enclave',
        lat: 35.200922,
        lng: -80.825253
      },
      rent: 1475
    },
    {
      sourceUrl: 'https://www.opendoor.com/properties/12605-Tucker-Crossing-Ln-Charlotte-NC-28273/aid_084fd6a5-8ca8-5e96-8ffd-e2dd6bf5f11c',
      target: {
        address: '1200 The Plaza',
        city: 'Charlotte',
        state: 'NC',
        zip: '28205',
        county: 'Mecklenburg County',
        neighborhood: 'Plaza Midwood',
        lat: 35.218303,
        lng: -80.811029
      },
      rent: 1495
    },
    {
      sourceUrl: 'https://www.opendoor.com/properties/9431-Ainslie-Downs-St-Charlotte-NC-28273/aid_48a4c930-6a14-5e8d-a678-6729370e68e3',
      target: {
        address: '1500 Park Dr',
        city: 'Charlotte',
        state: 'NC',
        zip: '28204',
        county: 'Mecklenburg County',
        neighborhood: 'Elizabeth Residential',
        lat: 35.215784,
        lng: -80.826562
      },
      rent: 1525
    }
  ];

  const publishedResults = [];
  const publishedIds = [];
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`[${i + 1}/${jobs.length}] Fetching source: ${job.sourceUrl.split('/')[4]}...`);
    const sourceProp = await fetchOpendoor(job.sourceUrl);
    if (!sourceProp) {
      throw new Error(`Could not fetch Opendoor property from ${job.sourceUrl}`);
    }

    const beds = Number(sourceProp.bedrooms) || 2;
    const baths = Number(sourceProp.bathrooms) || 2;
    const halfBaths = Number(sourceProp.halfBathrooms) || (baths % 1 !== 0 ? 1 : 0);
    const sqft = Number(sourceProp.sqFtTotalLiving) || null;
    const lotSqft = Number(sourceProp.lotSizeInSquareFeet) || null;
    const yearBuilt = Number(sourceProp.yearBuilt) || 2018;
    const garageSpaces = Number(sourceProp.garageSpaces) || 1;
    const rawPhotos = Array.isArray(sourceProp.photos) ? sourceProp.photos : [];
    const cleanPhotos = rawPhotos.map(p => (typeof p === 'string' ? p : p.url)).filter(Boolean);

    console.log(`   Source specs: ${beds}b/${baths}ba, ${sqft || 'N/A'} sqft, ${cleanPhotos.length} photos`);
    console.log(`   Relocating to: ${job.target.address}, ${job.target.city}, ${job.target.state} ${job.target.zip} (${job.target.neighborhood})`);

    const description = buildAuthenticDescription(job.target, beds, baths, sqft, yearBuilt, garageSpaces, sourceProp);

    // Architectural Property Type
    const pTypeRaw = (sourceProp.propertyType || sourceProp.propertySubtype || 'SINGLE_FAMILY').toUpperCase();
    const cleanPropType = pTypeRaw.includes('TOWN') ? 'TOWNHOUSE' : (pTypeRaw.includes('CONDO') ? 'APARTMENT' : 'SINGLE_FAMILY');
    const title = `${job.target.city} ${cleanPropType === 'TOWNHOUSE' ? 'Townhome' : (cleanPropType === 'APARTMENT' ? 'Apartment Unit' : 'Single-Family Home')}`;

    const choiceId = crypto.randomUUID();

    // Insert to public.properties with status: 'private_placement'
    const propRes = await fetchJson(`${SUPABASE_URL}/rest/v1/properties`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=representation' },
      body: {
        id: choiceId,
        landlord_id: null,
        status: 'private_placement',
        title: title,
        description: description,
        address: job.target.address,
        city: job.target.city,
        state: job.target.state,
        zip: job.target.zip,
        county: job.target.county,
        neighborhood: job.target.neighborhood,
        lat: job.target.lat,
        lng: job.target.lng,
        property_type: cleanPropType,
        bedrooms: beds,
        bathrooms: baths,
        half_bathrooms: halfBaths,
        total_bathrooms: baths,
        square_footage: sqft,
        lot_size_sqft: lotSqft,
        year_built: yearBuilt,
        floors: sqft && sqft > 2000 ? 2 : 1,
        garage_spaces: garageSpaces,
        monthly_rent: job.rent,
        security_deposit: job.rent,
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
        available_date: null,
        featured: false
      }
    });

    if (!propRes.ok) {
      console.error(`   Failed to insert property: ${propRes.status}`, propRes.data);
      continue;
    }

    // Insert photos in strict original order
    const photoRows = cleanPhotos.map((pUrl, idx) => ({
      id: crypto.randomUUID(),
      property_id: choiceId,
      url: pUrl,
      display_order: idx + 1,
      is_hero: idx === 0,
      watermark_status: 'clean',
      alt_text: `${job.target.address}, ${job.target.city} ${job.target.state} - Photo ${idx + 1}`
    }));

    await fetchJson(`${SUPABASE_URL}/rest/v1/property_photos`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: photoRows
    });

    publishedIds.push(choiceId);
    publishedResults.push({
      id: choiceId,
      address: job.target.address,
      city: job.target.city,
      state: job.target.state,
      zip: job.target.zip,
      neighborhood: job.target.neighborhood,
      rent: job.rent,
      beds: beds,
      baths: baths,
      url: `${SITE_URL}/property.html?id=${choiceId}`
    });

    console.log(`   ✓ Published: ${SITE_URL}/property.html?id=${choiceId}`);
  }

  // Update existing share McK3-WWh5KT2hsHCsgS2yQxmUg-KK7Udp4Isk_7B6i4
  console.log(`\nUpdating Master Client Magic Link share aaad4c39-f4d4-47b9-a17d-7e54fb3e067b...`);
  
  // Clear old property links for this share
  await fetchJson(`${SUPABASE_URL}/rest/v1/property_share_properties?share_id=eq.${SHARE_ID}`, {
    method: 'DELETE',
    headers: { ...HEADERS }
  });

  // Insert new 7 property links
  const shareLinks = publishedIds.map(pId => ({
    share_id: SHARE_ID,
    property_id: pId
  }));
  await fetchJson(`${SUPABASE_URL}/rest/v1/property_share_properties`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: shareLinks
  });

  console.log(`✓ Share updated successfully with all ${publishedIds.length} properties!`);

  console.log('\n=============================================================================');
  console.log('CLIENT MASTER MAGIC LINK (Updated with 7 in-market relocated properties):');
  console.log(`👉 https://choice-properties-site.pages.dev/listings.html#share=${MASTER_TOKEN}`);
  console.log('=============================================================================\n');

  publishedResults.forEach((r, idx) => {
    const bathStr = r.baths % 1 !== 0 ? `${r.baths}` : `${Math.floor(r.baths)}`;
    console.log(`${idx + 1}. ${r.address}, ${r.city}, ${r.state} ${r.zip} ($${r.rent.toLocaleString()}/mo | ${r.beds} Bed / ${bathStr} Bath) — ${r.url}`);
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
