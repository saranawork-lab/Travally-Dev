const { PrismaClient } = require("@prisma/client");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const mongoUri = process.env.DATABASE_URL || "mongodb://localhost:27017/travally";

async function main() {
  console.log("Seeding 3 authentic Indian demo accounts for Travally...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. ANANYA SHARMA (Bengaluru)
  const ananyaData = {
    email: "ananya@travally.app",
    displayName: "Ananya Sharma",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    bio: "Specialty filter coffee addict, Suchitra Film Society regular, and weekend sketcher in Cubbon Park. Working in tech by day; love exploring indie bookshops and heritage cafes on Saturdays.",
    birthDate: new Date("1997-04-14"),
    age: 27,
    gender: "FEMALE",
    city: "Bengaluru",
    country: "India",
    interests: JSON.stringify(["Indie Cinema", "Specialty Coffee", "Cubbon Park", "Book Reading", "Board Games"]),
    preferredActivities: JSON.stringify(["Movies", "Food and Cafes", "Walking", "City Exploration"]),
    connectionPreferences: JSON.stringify({ friendship: true, activityPartner: true, dating: false, travel: true }),
    isVerified: true,
    verificationStatus: "VERIFIED",
    linkedinUrl: "https://linkedin.com/in/ananya-sharma-travally",
    smoker: "NO",
    drinker: "OCCASIONALLY",
    diet: "VEGETARIAN",
    lifestyleVisible: true,
  };

  // 2. ROHAN VERMA (Mumbai)
  const rohanData = {
    email: "rohan@travally.app",
    displayName: "Rohan Verma",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    bio: "Architectural photographer and weekend Sahyadri trekker. Love Marine Drive night strolls, Bandra vintage cafes, and spontaneous sunset cycling along Worli Sea Face.",
    birthDate: new Date("1995-11-20"),
    age: 29,
    gender: "MALE",
    city: "Mumbai",
    country: "India",
    interests: JSON.stringify(["Architecture", "Street Photography", "Sahyadri Treks", "Bandra Cafes", "Cycling"]),
    preferredActivities: JSON.stringify(["City Exploration", "Walking", "Food and Cafes", "Events"]),
    connectionPreferences: JSON.stringify({ friendship: true, activityPartner: true, dating: false, travel: true }),
    isVerified: true,
    verificationStatus: "VERIFIED",
    linkedinUrl: "https://linkedin.com/in/rohan-verma-travally",
    smoker: "NO",
    drinker: "YES",
    diet: "NON_VEGETARIAN",
    lifestyleVisible: true,
  };

  // 3. PRIYA IYER (New Delhi)
  const priyaData = {
    email: "priya@travally.app",
    displayName: "Priya Iyer",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    bio: "Himalayan trekker, tea garden wanderer, and slow-travel enthusiast. Hiked Kasol, Kheerganga, and Living Root Bridges. Looking for verified travel companions for North-East & Spiti road expeditions!",
    birthDate: new Date("1998-03-08"),
    age: 26,
    gender: "FEMALE",
    city: "New Delhi",
    country: "India",
    interests: JSON.stringify(["Himalayan Treks", "Monastery Trails", "Himachali Food", "Road Trips", "Camping"]),
    preferredActivities: JSON.stringify(["City Exploration", "Food and Cafes", "Walking"]),
    connectionPreferences: JSON.stringify({ friendship: true, travel: true, activityPartner: true }),
    isVerified: true,
    verificationStatus: "VERIFIED",
    linkedinUrl: "https://linkedin.com/in/priya-iyer-travally",
    smoker: "NO",
    drinker: "NO",
    diet: "VEGETARIAN",
    lifestyleVisible: true,
  };

  const demoAccounts = [ananyaData, rohanData, priyaData];
  const createdUsers = [];

  for (const account of demoAccounts) {
    let user = await prisma.user.findUnique({
      where: { email: account.email },
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: account.email,
          passwordHash,
          role: "USER",
          profile: {
            create: {
              displayName: account.displayName,
              avatarUrl: account.avatarUrl,
              bio: account.bio,
              birthDate: account.birthDate,
              age: account.age,
              gender: account.gender,
              city: account.city,
              country: account.country,
              interests: account.interests,
              preferredActivities: account.preferredActivities,
              connectionPreferences: account.connectionPreferences,
              isVerified: account.isVerified,
              verificationStatus: account.verificationStatus,
              linkedinUrl: account.linkedinUrl,
            },
          },
        },
        include: { profile: true },
      });
      console.log(`Created user ${account.displayName} (${account.email}) - ID: ${user.id}`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          profile: {
            update: {
              displayName: account.displayName,
              avatarUrl: account.avatarUrl,
              bio: account.bio,
              birthDate: account.birthDate,
              age: account.age,
              gender: account.gender,
              city: account.city,
              country: account.country,
              interests: account.interests,
              preferredActivities: account.preferredActivities,
              connectionPreferences: account.connectionPreferences,
              isVerified: account.isVerified,
              verificationStatus: account.verificationStatus,
              linkedinUrl: account.linkedinUrl,
            },
          },
        },
        include: { profile: true },
      });
      console.log(`Updated user ${account.displayName} (${account.email}) - ID: ${user.id}`);
    }
    createdUsers.push({ ...user, meta: account });
  }

  // Seed MongoDB collections: community_posts, grow_initiatives, profiles lifestyle badges
  let client;
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db("travally");

    // Update lifestyle settings in MongoDB user collection
    for (const u of createdUsers) {
      await db.collection("users").updateOne(
        { email: u.email },
        {
          $set: {
            smoker: u.meta.smoker,
            drinker: u.meta.drinker,
            diet: u.meta.diet,
            lifestyleVisible: u.meta.lifestyleVisible,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: false }
      );
    }

    // Seed Posts (community_posts)
    const postsColl = db.collection("community_posts");
    const samplePosts = [
      {
        authorId: createdUsers[0].id,
        authorName: "Ananya Sharma",
        authorAvatar: createdUsers[0].meta.avatarUrl,
        authorCity: "Bengaluru",
        authorRank: 2,
        isVerified: true,
        content: "Morning filter coffee and quiet sketchpad hours at Church Street. Bengaluru rain makes indie bookshops feel so serene.",
        imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
        locationName: "Church Street, Bengaluru",
        likedBy: [],
        repostedBy: [],
        likesCount: 14,
        repostsCount: 2,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        authorId: createdUsers[1].id,
        authorName: "Rohan Verma",
        authorAvatar: createdUsers[1].meta.avatarUrl,
        authorCity: "Mumbai",
        authorRank: 3,
        isVerified: true,
        content: "Dusk over Marine Drive. The city never sleeps, but watching the sunset from the promenade is always therapeutic.",
        imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80",
        locationName: "Marine Drive, Mumbai",
        likedBy: [],
        repostedBy: [],
        likesCount: 28,
        repostsCount: 5,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        authorId: createdUsers[2].id,
        authorName: "Priya Iyer",
        authorAvatar: createdUsers[2].meta.avatarUrl,
        authorCity: "New Delhi",
        authorRank: 4,
        isVerified: true,
        content: "Crisp pine air and mountain trails in Himachal. Planning a road trip across Kinnaur and Spiti next month!",
        imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
        locationName: "Kasol Valley, Himachal",
        likedBy: [],
        repostedBy: [],
        likesCount: 36,
        repostsCount: 7,
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ];

    for (const post of samplePosts) {
      const existing = await postsColl.findOne({ authorId: post.authorId, content: post.content });
      if (!existing) {
        await postsColl.insertOne(post);
        console.log(`Inserted community post for ${post.authorName}`);
      }
    }

    // Seed Grow Initiatives (grow_initiatives)
    const growColl = db.collection("grow_initiatives");
    const sampleGrow = [
      {
        organizerId: createdUsers[0].id,
        organizerName: "Ananya Sharma",
        organizerAvatar: createdUsers[0].meta.avatarUrl,
        organizerCity: "Bengaluru",
        title: "Cubbon Park Green Canopy & Native Seedball Drive",
        description: "Join us this Saturday morning to plant native saplings and prepare seedballs for local green zones. Gloves & seed supplies provided!",
        causeCategory: "PLANTATION",
        locationName: "Cubbon Park Bandstand Gate, Bengaluru",
        date: "2026-10-24",
        volunteersNeeded: 25,
        volunteersCount: 8,
        joinedUserIds: [createdUsers[0].id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        organizerId: createdUsers[1].id,
        organizerName: "Rohan Verma",
        organizerAvatar: createdUsers[1].meta.avatarUrl,
        organizerCity: "Mumbai",
        title: "Versova Coastal Clean & Plastic Recovery Action",
        description: "Weekly coastal restoration meetup to clear plastic waste from the shorelines. Bring your energy and sun hats!",
        causeCategory: "CLEAN_OCEAN",
        locationName: "Versova Beach North End, Mumbai",
        date: "2026-10-25",
        volunteersNeeded: 30,
        volunteersCount: 12,
        joinedUserIds: [createdUsers[1].id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        organizerId: createdUsers[2].id,
        organizerName: "Priya Iyer",
        organizerAvatar: createdUsers[2].meta.avatarUrl,
        organizerCity: "New Delhi",
        title: "Himalayan Foothills Trail Cleanup & Zero-Waste Drive",
        description: "Educating tourists and clearing trekking trails of discarded wrappers and PET bottles along the riverside paths.",
        causeCategory: "NATURE",
        locationName: "Parvati Riverside Trail, Kasol",
        date: "2026-10-28",
        volunteersNeeded: 20,
        volunteersCount: 9,
        joinedUserIds: [createdUsers[2].id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const grow of sampleGrow) {
      const existing = await growColl.findOne({ organizerId: grow.organizerId, title: grow.title });
      if (!existing) {
        await growColl.insertOne(grow);
        console.log(`Inserted Grow initiative for ${grow.organizerName}`);
      }
    }
  } catch (err) {
    console.error("MongoDB direct seeding note:", err.message);
  } finally {
    if (client) await client.close();
  }

    // Seed sample activities & travel plans in Prisma
    const ananya = createdUsers[0];
    const rohan = createdUsers[1];
    const priya = createdUsers[2];

    const existingAct = await prisma.activity.findFirst({ where: { organizerId: ananya.id } });
    if (!existingAct) {
      await prisma.activity.create({
        data: {
          organizerId: ananya.id,
          title: "Specialty Filter Coffee & Indie Bookshop Crawl",
          description: "Exploring 3 artisanal roasteries in Indiranagar followed by quiet reading at a vintage bookstore.",
          category: "FOOD_CAFES",
          date: new Date("2026-10-25T10:00:00Z"),
          startTime: "10:00",
          approxDurationHours: 2.5,
          locationName: "12th Main Indiranagar, Bengaluru",
          meetingPointVenue: "Third Wave Roastery Entrance",
          maxParticipants: 3,
          currentAcceptedCount: 1,
        },
      });
    }

    const existingAnanyaTravel = await prisma.travelPlan.findFirst({ where: { organizerId: ananya.id } });
    if (!existingAnanyaTravel) {
      await prisma.travelPlan.create({
        data: {
          organizerId: ananya.id,
          destination: "Coorg, Karnataka",
          departureCity: "Bengaluru",
          travelStyle: "WEEKEND_ROADTRIP",
          startDate: new Date("2026-11-06"),
          endDate: new Date("2026-11-08"),
          budgetMin: 6000,
          budgetMax: 12000,
          currency: "INR",
          accommodationPreference: "HOMESTAY",
          transportPreference: "ROAD_TRIP",
          interests: JSON.stringify(["Coffee Estates", "Nature Trails", "Photography"]),
          plannedAttractions: JSON.stringify(["Raja's Seat", "Abbey Falls", "Dubare Elephant Camp"]),
          imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
        },
      });
    }

    const existingRohanAct = await prisma.activity.findFirst({ where: { organizerId: rohan.id } });
    if (!existingRohanAct) {
      await prisma.activity.create({
        data: {
          organizerId: rohan.id,
          title: "South Bombay Art Deco Sunset Photography Walk",
          description: "Capturing classic colonial architecture, Oval Maidan vistas, and golden hour reflections along Marine Drive.",
          category: "CITY_EXPLORATION",
          date: new Date("2026-10-26T16:30:00Z"),
          startTime: "16:30",
          approxDurationHours: 2.0,
          locationName: "Fort & Marine Drive, Mumbai",
          meetingPointVenue: "Eros Cinema Landmark",
          maxParticipants: 4,
          currentAcceptedCount: 2,
        },
      });
    }

    const existingRohanTravel = await prisma.travelPlan.findFirst({ where: { organizerId: rohan.id } });
    if (!existingRohanTravel) {
      await prisma.travelPlan.create({
        data: {
          organizerId: rohan.id,
          destination: "Harishchandragad, Maharashtra",
          departureCity: "Mumbai",
          travelStyle: "TREKKING_HIKING",
          startDate: new Date("2026-11-14"),
          endDate: new Date("2026-11-15"),
          budgetMin: 3500,
          budgetMax: 6000,
          currency: "INR",
          accommodationPreference: "CAMPING",
          transportPreference: "TRAIN",
          interests: JSON.stringify(["Sahyadri Forts", "Cliff Photography", "Sunrise Vistas"]),
          plannedAttractions: JSON.stringify(["Konkan Kada", "Kedareshwar Cave", "Taramati Peak"]),
          imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
        },
      });
    }

    const existingPriyaAct = await prisma.activity.findFirst({ where: { organizerId: priya.id } });
    if (!existingPriyaAct) {
      await prisma.activity.create({
        data: {
          organizerId: priya.id,
          title: "Old Delhi Heritage Food Trail & Spice Market Walk",
          description: "Early morning heritage walk through Chandni Chowk alleys, parathas, and Asia's largest spice market rooftop.",
          category: "FOOD_CAFES",
          date: new Date("2026-10-27T08:30:00Z"),
          startTime: "08:30",
          approxDurationHours: 3.0,
          locationName: "Chandni Chowk, New Delhi",
          meetingPointVenue: "Jama Masjid Gate 3",
          maxParticipants: 4,
          currentAcceptedCount: 2,
        },
      });
    }

    const existingPriyaTravel = await prisma.travelPlan.findFirst({ where: { organizerId: priya.id } });
    if (!existingPriyaTravel) {
      await prisma.travelPlan.create({
        data: {
          organizerId: priya.id,
          destination: "Spiti Valley, Himachal Pradesh",
          departureCity: "New Delhi",
          travelStyle: "ROAD_TRIP",
          startDate: new Date("2026-11-20"),
          endDate: new Date("2026-11-30"),
          budgetMin: 18000,
          budgetMax: 28000,
          currency: "INR",
          accommodationPreference: "HOMESTAY",
          transportPreference: "ROAD_TRIP",
          interests: JSON.stringify(["Monasteries", "High Altitude Lakes", "Star Gazing", "Stargazing"]),
          plannedAttractions: JSON.stringify(["Kaza", "Key Monastery", "Chandratal", "Tabo Monastery"]),
          imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80",
        },
      });
    }

  console.log("Three demo accounts seeded successfully with activities, travel plans, grow causes, and community posts!");
}

main()
  .catch((e) => {
    console.error("Error seeding demo accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
