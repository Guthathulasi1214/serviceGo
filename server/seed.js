/**
 * ServiceGo — Database Seed Script
 * Creates dummy provider accounts (using .test TLD — guaranteed non-existent)
 * and populates ALL service categories with realistic services.
 *
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');

const MONGO_URI = process.env.MONGO_URI;

/* ── Dummy Providers (using .test TLD — RFC 2606 reserved, can never be real) ── */
const providers = [
    { name: 'Rajesh Kumar', email: 'rajesh.provider@servicego.test', phone: '9876500001', completedJobs: 142, averageRating: 4.8 },
    { name: 'Sunita Devi', email: 'sunita.provider@servicego.test', phone: '9876500002', completedJobs: 98, averageRating: 4.7 },
    { name: 'Amit Sharma', email: 'amit.provider@servicego.test', phone: '9876500003', completedJobs: 210, averageRating: 4.9 },
    { name: 'Priya Patel', email: 'priya.provider@servicego.test', phone: '9876500004', completedJobs: 64, averageRating: 4.6 },
    { name: 'Vikram Singh', email: 'vikram.provider@servicego.test', phone: '9876500005', completedJobs: 175, averageRating: 4.8 },
    { name: 'Meena Gupta', email: 'meena.provider@servicego.test', phone: '9876500006', completedJobs: 89, averageRating: 4.5 },
    { name: 'Arjun Reddy', email: 'arjun.provider@servicego.test', phone: '9876500007', completedJobs: 310, averageRating: 4.9 },
    { name: 'Kavita Nair', email: 'kavita.provider@servicego.test', phone: '9876500008', completedJobs: 56, averageRating: 4.4 },
];

/* ── ALL Services by Category ───────────────────────────── */
const allServices = [
    // ─── CLEANING ──────────────────
    { name: 'Full Home Deep Cleaning', category: 'cleaning', description: 'Complete deep cleaning of your entire home including all rooms, kitchen, and bathrooms. Professional-grade equipment used.', price: 1499, duration: 180 },
    { name: 'Bathroom Deep Cleaning', category: 'cleaning', description: 'Thorough scrubbing, descaling, and sanitization of bathrooms. Tiles, fixtures, and glass cleaned to perfection.', price: 499, duration: 60 },
    { name: 'Kitchen Deep Cleaning', category: 'cleaning', description: 'Complete kitchen degreasing, chimney cleaning, platform scrubbing, and sink sanitization.', price: 599, duration: 90 },
    { name: 'Sofa & Carpet Cleaning', category: 'cleaning', description: 'Professional shampooing and extraction of sofas, carpets, and rugs. Removes stains, allergens, and odors.', price: 799, duration: 90 },
    { name: 'Window Cleaning', category: 'cleaning', description: 'Streak-free cleaning of all windows, frames, and glass surfaces inside and outside.', price: 399, duration: 60 },

    // ─── PLUMBING ──────────────────
    { name: 'Pipe Leak Repair', category: 'plumbing', description: 'Detection and repair of pipe leaks. Includes joint sealing, pipe replacement if needed.', price: 349, duration: 60 },
    { name: 'Tap & Faucet Installation', category: 'plumbing', description: 'Installation of new taps, faucets, or mixer units. Old fixture removal included.', price: 249, duration: 45 },
    { name: 'Toilet Repair & Installation', category: 'plumbing', description: 'Fix flush issues, leaks, or install new toilet seats and commodes.', price: 499, duration: 60 },
    { name: 'Water Heater Installation', category: 'plumbing', description: 'Installation of geyser or water heater with proper piping and safety fittings.', price: 599, duration: 90 },
    { name: 'Drain Blockage Removal', category: 'plumbing', description: 'Professional unclogging of kitchen, bathroom, or sewer drains using advanced equipment.', price: 399, duration: 45 },

    // ─── ELECTRICAL ────────────────
    { name: 'Switch & Socket Repair', category: 'electrical', description: 'Repair or replacement of faulty switches, sockets, and boards. Includes safety check.', price: 199, duration: 30 },
    { name: 'Fan Installation', category: 'electrical', description: 'Ceiling fan, exhaust fan, or wall fan installation with wiring and testing.', price: 299, duration: 45 },
    { name: 'Light Fixture Installation', category: 'electrical', description: 'Installation of LED lights, chandeliers, tube lights, or decorative lighting.', price: 349, duration: 45 },
    { name: 'Full Home Wiring', category: 'electrical', description: 'Complete rewiring or new wiring for homes. Includes MCB, switchboard installation.', price: 2499, duration: 480 },
    { name: 'Inverter & UPS Installation', category: 'electrical', description: 'Setup of inverter/UPS with battery connection and earthing.', price: 799, duration: 90 },

    // ─── HOME REPAIR ───────────────
    { name: 'Furniture Repair', category: 'home-repair', description: 'Repair broken chairs, tables, beds, wardrobes. Includes re-gluing, screw tightening.', price: 399, duration: 60 },
    { name: 'Door & Window Repair', category: 'home-repair', description: 'Fix stuck doors, broken hinges, window latches, and handles.', price: 349, duration: 45 },
    { name: 'Wall Mounting Service', category: 'home-repair', description: 'Mount TVs, shelves, mirrors, photo frames, or curtain rods professionally.', price: 299, duration: 30 },
    { name: 'Waterproofing', category: 'home-repair', description: 'Waterproofing treatment for terrace, bathroom, or external walls to prevent seepage.', price: 1999, duration: 240 },

    // ─── APPLIANCE REPAIR ──────────
    { name: 'AC Repair & Service', category: 'appliance-repair', description: 'AC gas refill, cleaning, and servicing. Covers split and window ACs.', price: 399, duration: 60 },
    { name: 'Refrigerator Repair', category: 'appliance-repair', description: 'Fix cooling issues, gas leaks, thermostat problems, and compressor issues.', price: 499, duration: 60 },
    { name: 'Washing Machine Repair', category: 'appliance-repair', description: 'Repair motor, drum, drainage, and electronic panel issues for all brands.', price: 449, duration: 60 },
    { name: 'Microwave Repair', category: 'appliance-repair', description: 'Fix heating, turntable, door, and display issues in microwaves.', price: 349, duration: 45 },
    { name: 'Water Purifier Service', category: 'appliance-repair', description: 'Filter replacement, membrane cleaning, and full service for RO/UV purifiers.', price: 599, duration: 45 },

    // ─── COOKING ───────────────────
    { name: 'Home Cook Booking', category: 'cooking', description: 'Experienced cook visits your home. North Indian, South Indian, Chinese cuisines available.', price: 799, duration: 120 },
    { name: 'Party Catering', category: 'cooking', description: 'Professional catering for house parties, birthdays, and small gatherings. Menu customizable.', price: 2999, duration: 300 },
    { name: 'Meal Preparation Service', category: 'cooking', description: 'Weekly meal prep service. Cook prepares and stores meals for the week.', price: 1499, duration: 180 },
    { name: 'Live Cooking Counter', category: 'cooking', description: 'Live dosa, chaat, or pasta counter setup for events and parties.', price: 3999, duration: 240 },

    // ─── BEAUTY & CARE ─────────────
    { name: 'Bridal Makeup', category: 'beauty', description: 'Complete bridal makeup with HD products. Includes hairstyling and draping assistance.', price: 4999, duration: 180 },
    { name: 'Party Makeup', category: 'beauty', description: 'Glamorous party makeup with professional products. Contouring, eye makeup, lip styling.', price: 1999, duration: 90 },
    { name: 'Hair Spa & Treatment', category: 'beauty', description: 'Deep conditioning, keratin treatment, or hair spa at your home.', price: 999, duration: 60 },
    { name: 'Facial & Cleanup', category: 'beauty', description: 'Customized facial treatment for glowing skin. Options: Gold, Diamond, Charcoal.', price: 699, duration: 45 },
    { name: 'Waxing & Threading', category: 'beauty', description: 'Full body waxing, threading, and bleach services at your doorstep.', price: 599, duration: 60 },

    // ─── DOMESTIC HELP ─────────────
    { name: 'Daily Maid Service', category: 'domestic-help', description: 'Regular housekeeping — sweeping, mopping, dusting, and utensil cleaning.', price: 4999, duration: 60 },
    { name: 'Babysitter Service', category: 'domestic-help', description: 'Trained babysitter for daytime or evening child care. CPR certified.', price: 799, duration: 240 },
    { name: 'Elderly Care', category: 'domestic-help', description: 'Compassionate eldercare attendant. Meal assistance, medicine reminders, companionship.', price: 999, duration: 480 },
    { name: 'Cook + Housekeeper', category: 'domestic-help', description: 'Combined cook and housekeeping service. Daily meals and home cleaning.', price: 8999, duration: 120 },

    // ─── MOVING ────────────────────
    { name: 'House Shifting', category: 'moving', description: 'Complete packing, loading, transport, and unloading for local and city moves.', price: 4999, duration: 480 },
    { name: 'Packing & Moving', category: 'moving', description: 'Professional packing with bubble wrap, cartons, and safe transport.', price: 2999, duration: 300 },
    { name: 'Furniture Disassembly & Assembly', category: 'moving', description: 'Disassemble furniture for moving and reassemble at new location.', price: 1499, duration: 120 },

    // ─── LAUNDRY ───────────────────
    { name: 'Clothes Wash & Iron', category: 'laundry', description: 'Pickup, wash, press, and deliver. Gentle cycle for delicates.', price: 299, duration: 1440 },
    { name: 'Dry Cleaning Service', category: 'laundry', description: 'Professional dry cleaning for suits, sarees, lehengas, and delicate garments.', price: 499, duration: 2880 },
    { name: 'Carpet & Curtain Laundry', category: 'laundry', description: 'Pickup and deep clean heavy carpets, curtains, and rugs.', price: 799, duration: 2880 },

    // ─── GARDEN & OUTDOOR ──────────
    { name: 'Gardening Service', category: 'outdoor', description: 'Lawn mowing, hedge trimming, plant care, and garden maintenance.', price: 599, duration: 120 },
    { name: 'Terrace Garden Setup', category: 'outdoor', description: 'Design and setup of terrace garden with pots, soil, and plants.', price: 2999, duration: 240 },
    { name: 'Tree Trimming', category: 'outdoor', description: 'Professional tree pruning, branch cutting, and stump removal.', price: 999, duration: 120 },

    // ─── EVENT SERVICES ────────────
    { name: 'Birthday Party Decoration', category: 'event', description: 'Balloon decoration, banners, themed setup for birthday parties at home.', price: 1999, duration: 120 },
    { name: 'Event Photography', category: 'event', description: 'Professional photographer for events, parties, and celebrations.', price: 3999, duration: 240 },
    { name: 'DJ & Music Setup', category: 'event', description: 'DJ with speakers, lighting, and music setup for house parties and events.', price: 4999, duration: 300 },
    { name: 'Anniversary Decoration', category: 'event', description: 'Romantic room or hall decoration for anniversaries. Flowers, candles, lighting.', price: 2499, duration: 120 },

    // ─── SECURITY & INSTALL ────────
    { name: 'CCTV Camera Installation', category: 'security', description: '2/4/8 camera CCTV setup with DVR/NVR, wiring, and mobile app configuration.', price: 3999, duration: 180 },
    { name: 'Smart Lock Installation', category: 'security', description: 'Install fingerprint, keypad, or app-based smart locks on doors.', price: 2499, duration: 60 },
    { name: 'Video Doorbell Setup', category: 'security', description: 'Install and configure video doorbells with Wi-Fi and mobile alerts.', price: 1499, duration: 45 },

    // ─── PAINTING ──────────────────
    { name: 'Interior Wall Painting', category: 'painting', description: 'Full interior painting with premium paints. Includes surface prep and 2 coats.', price: 7999, duration: 1440 },
    { name: 'Exterior Painting', category: 'painting', description: 'Weather-resistant exterior painting. Crack filling and primer included.', price: 12999, duration: 2880 },
    { name: 'Texture & Accent Wall', category: 'painting', description: 'Decorative texture painting or accent wall design for living rooms and bedrooms.', price: 2999, duration: 480 },

    // ─── CARPENTRY ─────────────────
    { name: 'Custom Furniture', category: 'carpentry', description: 'Custom-built wardrobes, bookshelves, TV units, or kitchen cabinets.', price: 9999, duration: 2880 },
    { name: 'Door & Window Fitting', category: 'carpentry', description: 'New door or window frame fitting with proper alignment and hardware.', price: 2499, duration: 240 },
    { name: 'Modular Kitchen Setup', category: 'carpentry', description: 'Complete modular kitchen design and installation with fittings.', price: 49999, duration: 4320 },

    // ─── PEST CONTROL ──────────────
    { name: 'General Pest Control', category: 'pest-control', description: 'Treatment for cockroaches, ants, and spiders. Safe for kids and pets.', price: 999, duration: 60 },
    { name: 'Termite Treatment', category: 'pest-control', description: 'Anti-termite chemical treatment for walls, furniture, and flooring.', price: 2499, duration: 120 },
    { name: 'Bed Bug Treatment', category: 'pest-control', description: 'Chemical spray and heat treatment to eliminate bed bugs completely.', price: 1499, duration: 90 },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clean up old seeded data (only .test emails)
        const oldProviders = await User.find({ email: /@servicego\.test$/ });
        const oldProviderIds = oldProviders.map(p => p._id);
        if (oldProviderIds.length > 0) {
            await Service.deleteMany({ provider: { $in: oldProviderIds } });
            await User.deleteMany({ _id: { $in: oldProviderIds } });
            console.log(`🗑  Cleaned ${oldProviderIds.length} old seeded providers and their services`);
        }

        // Create providers
        const createdProviders = [];
        for (const p of providers) {
            const user = await User.create({
                name: p.name,
                email: p.email,
                password: 'Test@12345',
                role: 'provider',
                phone: p.phone,
                isVerified: true,
                completedJobs: p.completedJobs,
                averageRating: p.averageRating,
            });
            createdProviders.push(user);
            console.log(`👤 Created provider: ${user.name} (${user.email})`);
        }

        // Create services (round-robin assign to providers)
        let serviceCount = 0;
        for (let i = 0; i < allServices.length; i++) {
            const s = allServices[i];
            const provider = createdProviders[i % createdProviders.length];

            const service = await Service.create({
                name: s.name,
                category: s.category,
                description: s.description,
                price: s.price,
                duration: s.duration,
                provider: provider._id,
                isActive: true,
                isApproved: true,
            });

            // Add to provider's servicesOffered
            await User.findByIdAndUpdate(provider._id, {
                $addToSet: { servicesOffered: service._id },
            });

            serviceCount++;
        }

        console.log(`\n🎉 Seeded ${serviceCount} services across ${new Set(allServices.map(s => s.category)).size} categories`);
        console.log(`👥 Created ${createdProviders.length} dummy providers`);
        console.log('\n📧 All provider emails use @servicego.test (RFC 2606 reserved TLD — cannot receive real email)');
        console.log('🔑 All providers password: Test@12345');

        // Show category breakdown
        const counts = {};
        allServices.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
        console.log('\n📊 Category breakdown:');
        Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count} services`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Done! Disconnected from MongoDB.');
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();
