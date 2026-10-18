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

const OPENDOOR_COLUMBUS_LISTINGS = [
  {
    url: 'https://www.opendoor.com/properties/3223-Berkley-Pointe-Dr-Columbus-OH-43230/aid_37d431f7-da17-59de-96b4-feb46fccfdbe',
    assignedRent: 1800,
    relocated: {
      address: '3420 Cheviot Ave',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45211',
      county: 'Hamilton County',
      lat: 39.149635,
      lng: -84.606577
    }
  },
  {
    url: 'https://www.opendoor.com/properties/712-Fleetrun-Ave-Columbus-OH-43230/aid_6aa2f62c-2928-56be-b08e-ce5036262b4f',
    assignedRent: 1900,
    relocated: {
      address: '4518 Rapid Run Rd',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45238',
      county: 'Hamilton County',
      lat: 39.116032,
      lng: -84.588759
    }
  },
  {
    url: 'https://www.opendoor.com/properties/610-Executive-Blvd-Delaware-OH-43015/aid_658c0180-2282-5342-a99e-9873afdbd51f',
    assignedRent: 1850,
    relocated: {
      address: '1624 Cedar Ave',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45224',
      county: 'Hamilton County',
      lat: 39.198852,
      lng: -84.547710
    }
  },
  {
    url: 'https://www.opendoor.com/properties/3192-Wild-Dunes-Ct-Pickerington-OH-43147/aid_021fe4d5-4a4c-517b-ae93-a5555edb68a0',
    assignedRent: 1750,
    relocated: {
      address: '1820 Sutton Ave',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45230',
      county: 'Hamilton County',
      lat: 39.085095,
      lng: -84.390440
    }
  },
  {
    url: 'https://www.opendoor.com/properties/3841-Bay-Village-St-Columbus-OH-43232/aid_ea5f10fd-b20f-5aa4-b2da-fd0c26a0fc2c',
    assignedRent: 1700,
    relocated: {
      address: '7120 Plainfield Rd',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45236',
      county: 'Hamilton County',
      lat: 39.182153,
      lng: -84.401654
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
  
  return `Welcome to ${address}, a classic ${beds}-bedroom, ${baths}-bathroom standalone single-family residence situated in a quiet, established ${city} neighborhood. Delivering ${sqft.toLocaleString()} square feet of comfortable living space, this home features a thoughtful interior layout that effortlessly connects the welcoming central living room with bright dining and culinary spaces.

The kitchen is equipped with durable countertops, ample cabinet storage, and a full itemized appliance inventory including refrigerator, electric range and oven, dishwasher, and microwave.

Each of the ${beds} bedrooms offers generous dimensions and dedicated wardrobe closets. The primary bedroom suite provides a serene retreat with a private en-suite bathroom, modern fixtures, and vanity storage. Secondary bedrooms share convenient access to pristine hallway bathroom facilities.

Year-round comfort is assured with efficient central heating and air conditioning, accompanied by dedicated interior laundry hookups. Outside, enjoy a level private backyard and convenient attached garage and private driveway parking.

Pet-friendly living welcomes your companion animals. A standard $50 application fee applies per adult applicant. Submit your rental application today at Choice Properties.`.trim();
}

async function run() {
  console.log('=== SCRAPING 5 COLUMBUS OPENDOOR 3B2B LISTINGS & RELOCATING TO CINCINNATI (MULTI-ZIP) ===\n');

  const publishedProperties = [];

  for (let i = 0; i < OPENDOOR_COLUMBUS_LISTINGS.length; i++) {
    const item = OPENDOOR_COLUMBUS_LISTINGS[i];
    console.log(`[${i + 1}/5] Scraping Columbus Opendoor listing: ${item.url}`);
    
    const opendoorData = await fetchOpendoorPage(item.url);
    const sourceStreet = opendoorData.street;
    const sourceCity = opendoorData.city;
    const sourceState = opendoorData.state;
    const sourceZip = opendoorData.zip;
    const sourcePrice = opendoorData.listPrice;
    const sourceSqft = opendoorData.sqFtTotalLiving || 1400;
    const beds = opendoorData.bedrooms || 3;
    const baths = opendoorData.bathrooms || 2;
    const yearBuilt = opendoorData.yearBuilt ? parseInt(opendoorData.yearBuilt, 10) : 1975;
    
    const rawPhotos = opendoorData.photosXl || opendoorData.photosLg || opendoorData.photos || [];
    console.log(`   Source: ${sourceStreet}, ${sourceCity}, ${sourceState} (${beds} bed, ${baths} bath, ${sourceSqft} sqft, List Price: $${sourcePrice})`);
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

    console.log(`   Relocating to Cincinnati: ${targetAddress}, ${targetCity}, ${targetState} ${targetZip} ($${targetRent}/mo | ${beds} Bed / ${baths} Bath)`);

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
      year_built: yearBuilt,
      monthly_rent: targetRent,
      security_deposit: targetRent, // 1x monthly rent in DB strictly
      application_fee: 50, // Always $50
      pets_allowed: true, // Always pet-friendly
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

    // Insert property into public.properties
    await supabaseRequest('/rest/v1/properties', 'POST', propertyPayload);
    console.log(`   ✓ Property inserted into public.properties (private_placement)`);

    // Insert photos in strict original order
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
      console.log(`   ✓ Inserted ${photoRows.length} source CDN photos (hero: Photo 1)`);
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
      sourceAddress: `${sourceStreet}, ${sourceCity}, ${sourceState} ${sourceZip}`,
      sourcePrice: sourcePrice,
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
    expires_at: expiresAt,
    title: 'Cincinnati Curated Residences'
  };

  await supabaseRequest('/rest/v1/property_shares', 'POST', sharePayload);

  // Link all 5 published properties to the share
  const shareLinks = publishedProperties.map(p => ({
    share_id: shareId,
    property_id: p.id
  }));

  await supabaseRequest('/rest/v1/property_share_properties', 'POST', shareLinks);

  const masterMagicLink = `${SITE_URL}/listings.html#share=${rawToken}`;

  // Clear pipeline_properties to keep inbox clean
  try {
    await supabaseRequest('/rest/v1/pipeline_properties?id=neq.00000000-0000-0000-0000-000000000000', 'DELETE');
    console.log('\n✓ Cleaned and reset pipeline inbox.');
  } catch (e) {
    // Pipeline cleanup attempt
  }

  // Save published results locally
  fs.writeFileSync('scripts/published_cincinnati_results.json', JSON.stringify({
    masterMagicLink,
    properties: publishedProperties
  }, null, 2));

  console.log('\n===============================================================');
  console.log('ALL 5 PROPERTIES SUCCESSFULLY PUBLISHED AS PRIVATE PLACEMENT');
  console.log('===============================================================');
  console.log(`\nMASTER MAGIC LINK:\n${masterMagicLink}\n`);
  publishedProperties.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.address}, ${p.city}, ${p.state} ${p.zip} ($${p.rent.toLocaleString()}/mo | ${p.beds} Bed / ${p.baths} Bath) — ${p.url}`);
  });
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
