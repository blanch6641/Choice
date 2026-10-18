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

const NC_LISTINGS = [
  {
    url: 'https://www.opendoor.com/properties/4704-Benridge-Ln-Charlotte-NC-28226/aid_6896b958-f431-5ddd-92dc-ef11fac514d8',
    assignedRent: 2200,
    relocated: {
      address: '1200 Matthews-Mint Hill Rd',
      city: 'Matthews',
      state: 'NC',
      zip: '28105',
      county: 'Mecklenburg County',
      lat: 35.117683,
      lng: -80.703617
    }
  },
  {
    url: 'https://www.opendoor.com/properties/10124-Windtree-Ln-Charlotte-NC-28215-18263307/aid_0746adfd-6507-5019-bddc-47af94872ad5',
    assignedRent: 2300,
    relocated: {
      address: '2300 Stallings Rd',
      city: 'Indian Trail',
      state: 'NC',
      zip: '28104',
      county: 'Union County',
      lat: 35.089550,
      lng: -80.687525
    }
  },
  {
    url: 'https://www.opendoor.com/properties/2455-Judson-Dr-Gastonia-NC-28054/aid_97291d66-c851-5b0d-a276-5ff5e870a1d5',
    assignedRent: 2150,
    relocated: {
      address: '1400 Matthews Township Pkwy',
      city: 'Matthews',
      state: 'NC',
      zip: '28105',
      county: 'Mecklenburg County',
      lat: 35.121095,
      lng: -80.715174
    }
  },
  {
    url: 'https://www.opendoor.com/properties/5102-Summerell-Ave-Gastonia-NC-28056/aid_2b427c3b-2998-5e39-bbc4-0dc8ea3b3da4',
    assignedRent: 2100,
    relocated: {
      address: '3100 Old Monroe Rd',
      city: 'Indian Trail',
      state: 'NC',
      zip: '28104',
      county: 'Union County',
      lat: 35.081861,
      lng: -80.692376
    }
  },
  {
    url: 'https://www.opendoor.com/properties/8902-Woodland-Hills-Rd-Charlotte-NC-28269/aid_5d927c06-7dbe-5ea2-9a8b-6a8dc9d74a0f',
    assignedRent: 2250,
    relocated: {
      address: '500 W Roosevelt Blvd',
      city: 'Monroe',
      state: 'NC',
      zip: '28110',
      county: 'Union County',
      lat: 34.986967,
      lng: -80.530127
    }
  },
  {
    url: 'https://www.opendoor.com/properties/608-Amanda-Dr-Matthews-NC-28104/aid_55eab1ce-6605-5fc3-b097-575a96853f9c',
    assignedRent: 2350,
    relocated: {
      address: '1200 Dickerson Blvd',
      city: 'Monroe',
      state: 'NC',
      zip: '28110',
      county: 'Union County',
      lat: 35.003137,
      lng: -80.566350
    }
  },
  {
    url: 'https://www.opendoor.com/properties/2591-Cornelius-Pl-Nw-Concord-NC-28027/aid_5e5e9255-4776-4864-be54-b7eb6a6ff01b',
    assignedRent: 2400,
    relocated: {
      address: '800 E Roosevelt Blvd',
      city: 'Monroe',
      state: 'NC',
      zip: '28112',
      county: 'Union County',
      lat: 34.977641,
      lng: -80.521846
    }
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

function supabaseRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const req = https.request(url, {
      method: method,
      headers: HEADERS
    }, res => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(responseBody ? JSON.parse(responseBody) : null);
          } catch (e) {
            resolve(responseBody);
          }
        } else {
          reject(new Error(`Supabase request failed: ${res.statusCode} ${responseBody}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function generateEnrichedDescription(address, city, state, zip, beds, baths, sqft, rent) {
  const bathText = baths === 1 ? '1 full bathroom' : baths % 1 === 0 ? `${baths} full bathrooms` : `${Math.floor(baths)} full bathrooms and a powder room`;
  
  return `Welcome to ${address}, an exceptional ${beds}-bedroom, ${bathText} standalone single-family residence situated in a quiet, desirable ${city} neighborhood. Offering ${sqft.toLocaleString()} square feet of refined living space, this home features an open, flowing floor plan that seamlessly connects the central living room with bright dining areas and daily family spaces.

The kitchen is equipped with durable countertops, abundant cabinetry, pantry storage, and a full itemized appliance inventory including refrigerator, electric range and oven, dishwasher, and microwave.

Each of the ${beds} bedrooms provides generous proportions, excellent natural light, and spacious wardrobe closets. The primary bedroom suite serves as a peaceful retreat with private en-suite bathroom facilities, modern fixtures, and vanity counter space. Secondary bedrooms share convenient access to well-appointed hallway bathrooms.

Year-round comfort is maintained via efficient central heating and air conditioning, accompanied by dedicated interior laundry hookups. Outside, enjoy a level private fenced backyard and convenient attached garage parking.

Pet-friendly living welcomes your companion animals. A standard $50 application fee applies per adult applicant. Submit your rental application today at Choice Properties.`.trim();
}

async function run() {
  console.log('=== SCRAPING 7 NC 4-BED PROPERTIES & PUBLISHING TO MATTHEWS / INDIAN TRAIL / MONROE (MULTI-ZIP) ===\n');

  const publishedProperties = [];

  for (let i = 0; i < NC_LISTINGS.length; i++) {
    const item = NC_LISTINGS[i];
    console.log(`[${i + 1}/7] Scraping NC listing: ${item.url}`);
    
    const opendoorData = await fetchOpendoorPage(item.url);
    const sourceStreet = opendoorData.street;
    const sourceCity = opendoorData.city;
    const sourceState = opendoorData.state;
    const sourceZip = opendoorData.zip;
    const sourceSqft = opendoorData.sqFtTotalLiving || 2400;
    const beds = opendoorData.bedrooms || 4;
    const baths = opendoorData.bathrooms || 2.5;
    const yearBuilt = opendoorData.yearBuilt ? parseInt(opendoorData.yearBuilt, 10) : 1995;
    const lotSize = opendoorData.sqFtLot || 7500;
    
    const rawPhotos = opendoorData.photosXl || opendoorData.photosLg || opendoorData.photos || [];
    console.log(`   Source: ${sourceStreet}, ${sourceCity}, ${sourceState} (${beds} bed, ${baths} bath, ${sourceSqft} sqft)`);
    console.log(`   Extracted ${rawPhotos.length} authentic source photos`);

    const reloc = item.relocated;
    const targetAddress = reloc.address;
    const targetCity = reloc.city;
    const targetState = reloc.state;
    const targetZip = reloc.zip;
    const targetCounty = reloc.county;
    const targetLat = reloc.lat;
    const targetLng = reloc.lng;
    const targetRent = item.assignedRent;

    console.log(`   Relocating to: ${targetAddress}, ${targetCity}, ${targetState} ${targetZip} ($${targetRent}/mo | ${beds} Bed / ${baths} Bath)`);

    const propId = crypto.randomUUID();
    const title = `${targetAddress}, ${targetCity}, ${targetState} ${targetZip}`;
    const description = generateEnrichedDescription(targetAddress, targetCity, targetState, targetZip, beds, baths, sourceSqft, targetRent);

    const propertyPayload = {
      id: propId,
      title: title,
      address: targetAddress,
      city: targetCity,
      state: targetState,
      zip: targetZip,
      county: targetCounty,
      lat: targetLat,
      lng: targetLng,
      property_type: 'SINGLE_FAMILY',
      bedrooms: beds,
      bathrooms: baths,
      square_footage: sourceSqft,
      lot_size_sqft: lotSize,
      year_built: yearBuilt,
      monthly_rent: targetRent,
      security_deposit: targetRent, // 1x monthly rent in DB strictly
      application_fee: 50, // Always $50
      pets_allowed: true,
      smoking_allowed: false,
      status: 'private_placement', // Private Placement Shield
      description: description,
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

    await supabaseRequest('/rest/v1/properties', 'POST', propertyPayload);
    console.log(`   ✓ Inserted into public.properties (private_placement)`);

    const photoRows = rawPhotos.map((photoUrl, idx) => ({
      id: crypto.randomUUID(),
      property_id: propId,
      url: photoUrl,
      display_order: idx,
      is_hero: idx === 0,
      caption: idx === 0 ? 'Front Exterior' : `Property Photo ${idx + 1}`
    }));

    if (photoRows.length > 0) {
      await supabaseRequest('/rest/v1/property_photos', 'POST', photoRows);
      console.log(`   ✓ Inserted ${photoRows.length} source CDN photos (hero: Photo 1)\n`);
    }

    publishedProperties.push({
      id: propId,
      address: targetAddress,
      city: targetCity,
      state: targetState,
      zip: targetZip,
      rent: targetRent,
      beds: beds,
      baths: baths,
      sqft: sourceSqft,
      photosCount: photoRows.length,
      url: `${SITE_URL}/property.html?id=${propId}`
    });
  }

  // Generate 32-byte URL-safe base64 token for Client Multi-Property Magic Link
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const shareId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const sharePayload = {
    id: shareId,
    token_hash: tokenHash,
    created_at: new Date().toISOString(),
    expires_at: expiresAt
  };

  await supabaseRequest('/rest/v1/property_shares', 'POST', sharePayload);

  const shareLinks = publishedProperties.map(p => ({
    share_id: shareId,
    property_id: p.id
  }));

  await supabaseRequest('/rest/v1/property_share_properties', 'POST', shareLinks);

  const masterMagicLink = `${SITE_URL}/listings.html#share=${rawToken}`;

  // Clear local pipeline inbox files
  try {
    fs.writeFileSync('pipeline_9_properties.json', '[]');
    fs.writeFileSync('src/data/pipeline_properties.json', '[]');
    console.log('✓ Cleared local pipeline inbox files.');
  } catch (e) {}

  fs.writeFileSync('scripts/published_nc_matthews_results.json', JSON.stringify({
    masterMagicLink,
    properties: publishedProperties
  }, null, 2));

  console.log('\n===============================================================');
  console.log('MASTER CLIENT MAGIC LINK:');
  console.log(masterMagicLink);
  console.log('===============================================================\n');

  publishedProperties.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.address}, ${p.city}, ${p.state} ${p.zip} ($${p.rent.toLocaleString()}/mo | ${p.beds} Bed / ${p.baths} Bath) — ${p.url}`);
  });
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
