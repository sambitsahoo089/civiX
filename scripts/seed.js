// Seeds demo accounts and sample issues with generated placeholder photos.
// Run with: npm run db:seed
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:5434/?directConnection=true";
const MONGODB_DB = process.env.MONGODB_DB || "civix";

const EMOJI = {
  POTHOLES: "🕳️",
  STREETLIGHT: "💡",
  WATER_LEAK: "💧",
  FOOTPATH: "🚶",
  OPEN_DRAIN: "⚠️",
  ACCIDENT: "🚧",
  FIRE: "🔥",
  MEDICAL: "🚑",
  OTHER: "📋",
};

const COLORS = {
  POTHOLES: "#fbbf24",
  STREETLIGHT: "#facc15",
  WATER_LEAK: "#38bdf8",
  FOOTPATH: "#fb923c",
  OPEN_DRAIN: "#84cc16",
  ACCIDENT: "#ef4444",
  FIRE: "#f97316",
  MEDICAL: "#fb7185",
  OTHER: "#94a3b8",
};

const EMERGENCY_CATEGORIES = ["ACCIDENT", "FIRE", "MEDICAL"];
const SERVICES_BY_CATEGORY = {
  ACCIDENT: ["POLICE", "AMBULANCE", "FIRE"],
  FIRE: ["FIRE", "AMBULANCE", "POLICE"],
  MEDICAL: ["AMBULANCE", "POLICE"],
};
const HELPLINE_PHONE = "8895465904";
const HELPLINE_EMAIL = "comedydedanadan089@gmail.com";
const SERVICE_LABEL = { POLICE: "Police", AMBULANCE: "Ambulance", FIRE: "Fire brigade" };

// Sample issues near Bengaluru (12.97N, 77.59E)
const SAMPLES = [
  {
    category: "POTHOLES",
    description:
      "A large pothole on the main road near the bus stop has damaged two vehicles this week. It fills with water when it rains and is difficult to see at night.",
    latitude: 12.971599,
    longitude: 77.594566,
    address: "MG Road, near Trinity Circle",
    status: "IN_PROGRESS",
    changes: [
      { toStatus: "REPORTED", note: "Issue reported by citizen" },
      { toStatus: "ACKNOWLEDGED", note: "Logged in the repair queue" },
      { toStatus: "IN_PROGRESS", note: "Road crew assigned, repairs planned for Thursday" },
    ],
  },
  {
    category: "STREETLIGHT",
    description:
      "Streetlight on the corner has been out for over a week, leaving the stretch completely dark after sunset. It is a safety concern for pedestrians and cyclists.",
    latitude: 12.978425,
    longitude: 77.640827,
    address: "100 Feet Road, Indiranagar",
    status: "ACKNOWLEDGED",
    changes: [
      { toStatus: "REPORTED", note: "Issue reported by citizen" },
      { toStatus: "ACKNOWLEDGED", note: "Electrical crew notified" },
    ],
  },
  {
    category: "WATER_LEAK",
    description:
      "Water is continuously leaking from a broken pipe on the pavement, wasting hundreds of litres a day and creating a slippery hazard for passers-by.",
    latitude: 12.93524,
    longitude: 77.62447,
    address: "Jayanagar 4th Block, near the park",
    status: "REPORTED",
    changes: [{ toStatus: "REPORTED", note: "Issue reported by citizen" }],
  },
  {
    category: "FOOTPATH",
    description:
      "Several slabs on the footpath outside the school are broken and lifted, making it unsafe for children walking to class, especially after dark.",
    latitude: 12.991612,
    longitude: 77.57124,
    address: "Cunningham Road, near the school gate",
    status: "REPORTED",
    changes: [{ toStatus: "REPORTED", note: "Issue reported by citizen" }],
  },
  {
    category: "OPEN_DRAIN",
    description:
      "The drain cover is missing near the vegetable market, exposing an open drain right on the pedestrian path. Someone could easily fall in, especially children.",
    latitude: 13.006388,
    longitude: 77.575701,
    address: "Russell Market, Shivajinagar",
    status: "RESOLVED",
    changes: [
      { toStatus: "REPORTED", note: "Issue reported by citizen" },
      { toStatus: "ACKNOWLEDGED", note: "Sanitation department assigned" },
      { toStatus: "IN_PROGRESS", note: "New cover being fabricated" },
      { toStatus: "RESOLVED", note: "Cover installed and area secured" },
    ],
  },
  {
    category: "ACCIDENT",
    description:
      "Two-wheeler skidded and crashed on the wet flyover approach. The rider is injured and the damaged vehicle is blocking the left lane, traffic backing up fast.",
    latitude: 12.9602,
    longitude: 77.6487,
    address: "Old Airport Road flyover, Domlur",
    status: "REPORTED",
    informed: [],
    changes: [{ toStatus: "REPORTED", note: "Emergency reported by citizen" }],
  },
  {
    category: "FIRE",
    description:
      "Thick black smoke coming from the ground floor of the commercial building. No flames visible yet but the smell is strong and people are evacuating.",
    latitude: 12.9756,
    longitude: 77.6069,
    address: "Brigade Road, near the metro station",
    status: "ACKNOWLEDGED",
    informed: ["FIRE"],
    changes: [
      { toStatus: "REPORTED", note: "Emergency reported by citizen" },
      { toStatus: "ACKNOWLEDGED", note: "Fire control room notified, crew dispatched" },
    ],
  },
  {
    category: "MEDICAL",
    description:
      "Pedestrian collapsed at the bus stop and is unresponsive. Bystanders are supporting them but an ambulance is needed urgently.",
    latitude: 12.9887,
    longitude: 77.5892,
    address: "Cantonment Railway Station bus stop",
    status: "REPORTED",
    informed: ["AMBULANCE", "POLICE"],
    changes: [{ toStatus: "REPORTED", note: "Emergency reported by citizen" }],
  },
  {
    category: "OTHER",
    description:
      "A broken traffic signal pole is leaning dangerously over the cycle lane after last week's storm. It could fall on someone at any time.",
    latitude: 12.97194,
    longitude: 77.64169,
    address: "Old Airport Road, near Domlur flyover",
    status: "REJECTED",
    changes: [
      { toStatus: "REPORTED", note: "Issue reported by citizen" },
      { toStatus: "REJECTED", note: "Already reported under a different ticket — duplicate" },
    ],
  },
];

function svgFor(category) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="${COLORS[category]}"/>
  <rect x="0" y="380" width="800" height="120" fill="#334155"/>
  <text x="400" y="250" font-size="140" text-anchor="middle">${EMOJI[category]}</text>
  <text x="400" y="440" font-size="40" text-anchor="middle" fill="#e2e8f0">${category.replaceAll("_", " ")}</text>
</svg>`;
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: String,
});

const issueSchema = new mongoose.Schema({
  category: String,
  emergency: { type: Boolean, default: false },
  description: String,
  latitude: Number,
  longitude: Number,
  address: String,
  imageUrl: String,
  status: String,
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: Date,
  notifiedServices: [
    {
      service: String,
      by: String,
      method: String,
      at: Date,
      _id: false,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const alertLogSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
  kind: String,
  services: [String],
  triggeredBy: String,
  phone: String,
  email: String,
  channels: [{ channel: String, status: String, detail: String, _id: false }],
  message: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const statusChangeSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
  fromStatus: String,
  toStatus: String,
  note: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });

  // Guard: refuse to wipe a production database unless SEED_FORCE=true is set.
  if (process.env.NODE_ENV === "production" && !process.env.SEED_FORCE) {
    console.error("Refusing to seed a production database.");
    console.error("If you really mean it, re-run with SEED_FORCE=true.");
    process.exit(1);
  }

  const User = mongoose.models.User || mongoose.model("User", userSchema);
  const Issue = mongoose.models.Issue || mongoose.model("Issue", issueSchema);
  const StatusChange =
    mongoose.models.StatusChange || mongoose.model("StatusChange", statusChangeSchema);
  const AlertLog = mongoose.models.AlertLog || mongoose.model("AlertLog", alertLogSchema);

  const [authority, citizen] = await Promise.all([
    User.findOneAndUpdate(
      { email: "authority@city.gov" },
      {
        $setOnInsert: {
          name: "City Works Authority",
          email: "authority@city.gov",
          passwordHash: await bcrypt.hash("admin123", 10),
          role: "AUTHORITY",
        },
      },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: "citizen@example.com" },
      {
        $setOnInsert: {
          name: "Demo Citizen",
          email: "citizen@example.com",
          passwordHash: await bcrypt.hash("password123", 10),
          role: "CITIZEN",
        },
      },
      { upsert: true, new: true }
    ),
  ]);

  // Reset sample issues so the seed is idempotent.
  await StatusChange.deleteMany({});
  await AlertLog.deleteMany({});
  await Issue.deleteMany({});

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  for (let i = 0; i < SAMPLES.length; i++) {
    const sample = SAMPLES[i];
    const filename = `seed-${i + 1}.svg`;
    fs.writeFileSync(path.join(uploadsDir, filename), svgFor(sample.category));

    const resolvedAt =
      sample.status === "RESOLVED" ? new Date(Date.now() - 1000 * 60 * 60 * 24) : null;

    const emergency = EMERGENCY_CATEGORIES.includes(sample.category);
    const informed = emergency ? sample.informed || [] : [];

    const issue = await Issue.create({
      category: sample.category,
      emergency,
      description: sample.description,
      latitude: sample.latitude,
      longitude: sample.longitude,
      address: sample.address,
      imageUrl: `/uploads/${filename}`,
      status: sample.status,
      resolvedAt,
      reporter: citizen._id,
      notifiedServices: informed.map((service) => ({
        service,
        by: "CITIZEN",
        method: "CALL",
        at: new Date(Date.now() - 1000 * 60 * 90),
      })),
      createdAt: new Date(Date.now() - sample.changes.length * 1000 * 60 * 60 * 24),
    });

    // The citizen's helpline calls are part of the audit trail the authority sees.
    if (informed.length > 0) {
      await AlertLog.create({
        issue: issue._id,
        kind: "CITIZEN_CALL",
        services: informed,
        triggeredBy: informed[0],
        phone: HELPLINE_PHONE,
        email: HELPLINE_EMAIL,
        channels: [
          {
            channel: "SMS",
            status: "SKIPPED",
            detail: `Citizen dialled ${HELPLINE_PHONE} from the report form`,
          },
          {
            channel: "EMAIL",
            status: "SKIPPED",
            detail: `Call logged at reporting time — copy available at ${HELPLINE_EMAIL}`,
          },
        ],
        message: `Citizen informed ${informed
          .map((key) => SERVICE_LABEL[key] || key)
          .join(", ")} while reporting an emergency`,
        createdBy: citizen._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 90),
      });
    }

    await StatusChange.insertMany(
      sample.changes.map((change, idx) => ({
        issue: issue._id,
        fromStatus: idx === 0 ? null : sample.changes[idx - 1].toStatus,
        toStatus: change.toStatus,
        note: change.note,
        changedBy: change.toStatus === "REPORTED" ? citizen._id : authority._id,
        createdAt: new Date(Date.now() - (sample.changes.length - idx) * 1000 * 60 * 60 * 24),
      }))
    );
  }

  console.log("Seeded demo accounts:");
  console.log("  authority@city.gov / admin123 (authority)");
  console.log("  citizen@example.com / password123 (citizen)");
  console.log(`Seeded ${SAMPLES.length} sample issues with placeholder photos.`);
  console.log(
    `Includes ${SAMPLES.filter((s) => EMERGENCY_CATEGORIES.includes(s.category)).length} emergency reports (fire, accident, medical).`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err?.message || err);
  process.exit(1);
});