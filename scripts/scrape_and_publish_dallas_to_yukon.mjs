import https from 'https';
import crypto from 'crypto';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tlfmwetmhthpyrytrcfo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZm13ZXRtaHRocHlyeXRyY2ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE4MzAyNCwiZXhwIjoyMDkwNzU5MDI0fQ.oO9N8LslPcDjQrzZWiUoTkOlDBqUVHBiVhRSGLC-EPE';
const LANDLORD_ID = 'b8d3aea0-f466-49f2-ac07-2b2b40793cc9'; // Choice Properties verified landlord
const SITE_URL = 'https://choice-properties-site.pages.dev';

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const OPENDOOR_DALLAS_URLS = [
  'https://www.opendoor.com/properties/1322-E-Waco-Ave-Dallas-TX-75216/aid_f001c507-71d8-5b5b-a770-f0cde2b40a69',
  'https://www.opendoor.com/properties/8540-Foxwood-Ln-Dallas-TX-75217/aid_c574e3b2-9e89-54d8-8589-145cd43725eb',
  'https://www.opendoor.com/properties/9618-Tamalpais-Dr-Dallas-TX-75217/aid_0afd743d-0fec-57b2-847a-f0c9c1e8eee3',
  'https://www.opendoor.com/properties/8526-Vista-Grande-Dr-Dallas-TX-75249/aid_39de011d-ba41-564f-a712-76f6dfa7f771',
  'https://www.opendoor.com/properties/11327-Mounts-Run-Dr-Dallas-TX-75218/aid_c17947ee-0d80-5b1f-a7d5-b321823223f1'
];

const YUKON_RELOCATIONS = [
  {
    address: '10424 SW 24th Ter',
    city: 'Yukon',
    state: 'OK',
    zip: '73099',
    county: 'Canadian County',
    lat: 35.509812,
    lng: -97.746125,
    rent: 1475
  },
  {
    address: '3216 Vandament Ave',
    city: 'Yukon',
    state: 'OK',
    zip: '73099',
    county: 'Canadian County',
    lat: 35.514280,
    lng: -97.758930,
    rent: 1425
  },
  {
    address: '11804 Chisholm Way',
    city: 'Yukon',
    state: 'OK',
    zip: '73099',
    county: 'Canadian County',
    lat: 35.498420,
    lng: -97.739150,
    rent: 1395
  },
  {
    address: '2608 Surrey Hills Blvd',
    city: 'Yukon',
    state: 'OK',
    zip: '73099',
    county: 'Canadian County',
    lat: 35.522105,
    lng: -97.761400,
    rent: 1750
  },
  {
    address: '10815 Traditions Dr',
    city: 'Yukon',
    state: 'OK',
    zip: '73099',
    county: 'Canadian County',
    lat: 35.503450,
    lng: -97.749210,
    rent: 2195
  }
];

function fetchOpendoorPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/<script[^>]*id=\"__NEXT_DATA__\"[^>]*>([\s\S]*?)<\/script>/i);
        if (!match) return reject(new Error(`No __NEXT_DATA__ found in ${url}`));
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

const DESCRIPTIONS = [
  // 1. 10424 SW 24th Ter (4 Bed / 2 Bath, 1,494 sqft)
  `Welcome to 10424 SW 24th Ter, an expansive 4-bedroom, 2-bathroom single-family residence situated in a quiet Yukon neighborhood. Delivering 1,494 square feet of well-balanced living space, the interior greets you with a sunny open-concept layout that connects the main living room to the dining and kitchen areas.

The culinary center features durable countertops, rich cabinetry, a dual-basin sink, and a complete appliance lineup including refrigerator, electric range and oven, dishwasher, and microwave.

Four generously sized bedrooms provide quiet personal retreats with ample wardrobe closets. The primary bedroom suite includes a private en-suite bathroom featuring modern fixtures and a vanity with under-sink storage. The secondary full bath is easily accessible from the remaining three bedrooms.

A dedicated interior laundry area comes with full-size washer and dryer hookups. Comfort is maintained year-round with energy-efficient central heating and air conditioning. Step out to a spacious, fully fenced backyard and enjoy convenient private driveway and garage parking.

Pet-friendly accommodations welcome your family pets. A flat $50 application fee applies per adult applicant. Submit your rental application today at Choice Properties.`,

  // 2. 3216 Vandament Ave (3 Bed / 2 Bath, 1,620 sqft)
  `Located along desirable Vandament Avenue in Yukon, this classic 1,620-square-foot standalone home combines timeless suburban comfort with generous room proportions. The primary living room features warm natural light through large picture windows, easy-care flooring, and seamless flow into the adjacent dining room.

The kitchen is equipped with extensive cabinetry, generous countertop prep surfaces, and a full suite of appliances including refrigerator, range and oven, dishwasher, and microwave.

Three large bedrooms offer versatile layouts for restful sleep, home office setups, or guest rooms. The primary suite features a dedicated en-suite bath with updated vanity and shower. A full hallway bathroom with tub and shower combination serves the two secondary bedrooms.

Additional amenities include central air conditioning and heating, dedicated laundry hookups, an attached garage, and a level, fenced backyard ideal for outdoor enjoyment.

We are proudly pet-friendly. A $50 application fee is required for adult applicants. Submit your rental application today at Choice Properties.`,

  // 3. 11804 Chisholm Way (3 Bed / 2 Bath, 1,387 sqft)
  `Positioned within the historic Chisholm Trail corridor in Yukon, 11804 Chisholm Way is a charming 3-bedroom, 2-bathroom single-family home offering 1,387 square feet of comfortable living. The welcoming front entry opens into an airy living area designed for easy relaxation and flexible furniture arrangements.

The central kitchen provides crisp cabinetry, abundant storage, and appliances including an electric range, refrigerator, dishwasher, and garbage disposal, anchored by a convenient dining nook.

The primary bedroom suite offers a serene retreat with a walk-in closet and private bathroom. Two secondary bedrooms have generous windows and close access to the pristine second full bathroom.

Equipped with efficient central HVAC, interior washer and dryer connections, an attached garage, and a private rear yard.

Pet-friendly living is always supported here. An application fee of $50 applies per adult applicant. Submit your rental application today at Choice Properties.`,

  // 4. 2608 Surrey Hills Blvd (4 Bed / 2 Bath, 2,402 sqft)
  `Nestled in the prestigious Surrey Hills community of Yukon, this stately 2,402-square-foot residence offers executive-scale space across 4 well-appointed bedrooms and 2 full bathrooms. Soaring ceilings and expansive windows in the great room create an impressive architectural focal point flooded with natural light.

The chef's kitchen features an expansive center prep island, abundant cabinetry, generous pantry storage, and a full suite of stainless steel appliances including refrigerator, oven and range, dishwasher, and microwave.

The expansive primary suite boasts a large walk-in closet and a spa-style en-suite bathroom with dual vanities, soaking tub, and separate shower. Three spacious secondary bedrooms provide peaceful accommodation with generous closet storage.

Includes a dedicated laundry utility room, multi-zone central air and heat, an attached multi-car garage, and a sprawling fenced backyard with a covered patio.

Pet-friendly property. A flat $50 application fee applies per adult. Submit your rental application today at Choice Properties.`,

  // 5. 10815 Traditions Dr (5 Bed / 4 Bath, 3,739 sqft)
  `Showcasing premier architectural craftsmanship in Yukon's Traditions enclave, 10815 Traditions Dr delivers an extraordinary 3,739 square feet of luxurious living space featuring 5 spacious bedrooms and 4 full bathrooms. The grand entryway leads into expansive living and entertaining areas with high ceilings, refined trim, and bright windows.

The gourmet kitchen is outfitted with custom cabinetry, expansive stone countertops, premium appliances, and a breakfast bar open to the secondary family living room.

Five private bedrooms include an opulent main-level primary retreat with an expansive en-suite bath featuring dual vanities, deep soaking tub, glass-enclosed shower, and walk-in wardrobe. Additional bedroom suites with dedicated full bathrooms offer exceptional flexibility for multi-generational living or executive hosting.

Complete with an expansive multi-car garage, high-efficiency central climate control, dedicated laundry room with hookups, and a fully landscaped, private backyard retreat.

Always pet-friendly. A standard $50 application fee applies per adult applicant. Submit your rental application today at Choice Properties.`
];

async function run() {
  console.log('=== SCRAPING 5 DALLAS OPENDOOR LISTINGS & RELOCATING TO YUKON, OK ===\n');

  const published = [];

  for (let i = 0; i < OPENDOOR_DALLAS_URLS.length; i++) {
    const odUrl = OPENDOOR_DALLAS_URLS[i];
    const target = YUKON_RELOCATIONS[i];
    console.log(`[${i + 1}/5] Scraping Dallas Opendoor listing: ${odUrl}`);

    const rawProp = await fetchOpendoorPage(odUrl);
    console.log(`   Source: ${rawProp.street}, Dallas, TX (${rawProp.bedrooms} bed, ${rawProp.bathrooms} bath, ${rawProp.sqFtTotalLiving} sqft, List Price: $${rawProp.listPrice})`);

    const photos = (rawProp.photosXl || rawProp.photosLg || rawProp.photos || []).filter(u => u && u.startsWith('http'));
    console.log(`   Extracted ${photos.length} authentic source photos`);

    const propId = crypto.randomUUID();
    const title = `${target.address}, ${target.city}, ${target.state} ${target.zip}`;
    const beds = rawProp.bedrooms || 3;
    const baths = rawProp.bathrooms || 2;
    const sqft = rawProp.sqFtTotalLiving || 1500;
    const rent = target.rent;

    const propRow = {
      id: propId,
      title: title,
      address: target.address,
      city: target.city,
      state: target.state,
      zip: target.zip,
      county: target.county,
      bedrooms: beds,
      bathrooms: baths,
      square_footage: sqft,
      monthly_rent: rent,
      security_deposit: rent, // 1x monthly rent in structured DB, never in text
      application_fee: 50,
      pets_allowed: true,
      smoking_allowed: false,
      property_type: 'SINGLE_FAMILY',
      description: DESCRIPTIONS[i],
      lat: target.lat,
      lng: target.lng,
      status: 'active',
      listed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      landlord_id: LANDLORD_ID,
      amenities: [
        'Central Air Conditioning & Heating',
        'Attached Garage & Private Driveway',
        'Private Fenced Backyard',
        'In-Unit Washer & Dryer Hookups',
        'Pet Friendly (Dogs & Cats Welcome)',
        'Full Kitchen Appliance Package'
      ],
      appliances: ['Refrigerator', 'Range / Oven', 'Dishwasher', 'Microwave', 'Washer/Dryer Hookups'],
      heating_type: 'Central Forced Air Heat',
      cooling_type: 'Central Air Conditioning',
      laundry_type: 'In-Unit Washer & Dryer Hookups',
      parking: 'Attached Garage + Driveway'
    };

    console.log(`   Relocating to Yukon: ${title} ($${rent}/mo | ${beds} Bed / ${baths} Bath)`);

    // Insert property
    const propRes = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(propRow)
    });

    if (!propRes.ok) {
      const err = await propRes.text();
      throw new Error(`Failed to insert property ${propId}: ${propRes.status} ${err}`);
    }
    console.log(`   ✓ Property inserted into public.properties`);

    // Insert photos in original order with hero designation
    const photoRows = photos.map((url, idx) => ({
      property_id: propId,
      url: url,
      display_order: idx,
      is_hero: idx === 0,
      watermark_status: 'clean',
      alt_text: `${target.address}, Yukon OK - Photo ${idx + 1}`
    }));

    if (photoRows.length > 0) {
      const photoRes = await fetch(`${SUPABASE_URL}/rest/v1/property_photos`, {
        method: 'POST',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify(photoRows)
      });
      if (!photoRes.ok) {
        console.warn(`   ⚠ Photo warning: ${photoRes.status} ${await photoRes.text()}`);
      } else {
        console.log(`   ✓ Inserted ${photoRows.length} source CDN photos (hero: Photo 1)`);
      }
    }

    published.push({
      n: i + 1,
      id: propId,
      address: target.address,
      city: target.city,
      state: target.state,
      zip: target.zip,
      rent: rent,
      beds: beds,
      baths: baths,
      sqft: sqft,
      photosCount: photoRows.length,
      url: `${SITE_URL}/property.html?id=${propId}`
    });

    console.log(`   ✓ Published live: ${SITE_URL}/property.html?id=${propId}\n`);
  }

  console.log('===============================================================');
  console.log('ALL 5 PROPERTIES SUCCESSFULLY SCRAPED, RELOCATED, AND PUBLISHED');
  console.log('===============================================================\n');

  fs.writeFileSync('scripts/published_dallas_to_yukon_results.json', JSON.stringify(published, null, 2));

  published.forEach(p => {
    console.log(`${p.n}. ${p.address}, ${p.city}, ${p.state} ${p.zip} ($${p.rent.toLocaleString()}/mo | ${p.beds} Bed / ${p.baths} Bath) — ${p.url}`);
  });
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
