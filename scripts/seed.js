// Cleans the database and creates the two sign-in accounts.
// Run with: npm run db:seed        (add SEED_FORCE=true to wipe a production DB)
//
//   Authority : sambitkusahoo089@gmail.com / authority123
//   Citizen   : citizen@example.com / password123   (demo account — left empty)
//
// No sample issues, alerts or status history are created.
const bcrypt = require("bcryptjs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:5434/?directConnection=true";
const MONGODB_DB = process.env.MONGODB_DB || "civix";

const ACCOUNTS = [
  {
    name: "City Works Authority",
    email: "sambitkusahoo089@gmail.com",
    password: "authority123",
    role: "AUTHORITY",
  },
  {
    name: "Demo Citizen",
    email: "citizen@example.com",
    password: "password123",
    role: "CITIZEN",
  },
];

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: String,
});

const issueSchema = new mongoose.Schema(
  {
    category: String,
    emergency: Boolean,
    description: String,
    latitude: Number,
    longitude: Number,
    address: String,
    imageUrl: String,
    status: String,
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    notifiedServices: [{ service: String, by: String, method: String, at: Date, _id: false }],
  },
  { timestamps: true }
);

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
    console.error("Refusing to wipe a production database.");
    console.error("If you really mean it, re-run with SEED_FORCE=true.");
    process.exit(1);
  }

  const User = mongoose.models.User || mongoose.model("User", userSchema);
  const Issue = mongoose.models.Issue || mongoose.model("Issue", issueSchema);
  const StatusChange =
    mongoose.models.StatusChange || mongoose.model("StatusChange", statusChangeSchema);
  const AlertLog = mongoose.models.AlertLog || mongoose.model("AlertLog", alertLogSchema);

  // Full clean slate — accounts, reports, history, everything.
  await Promise.all([
    StatusChange.deleteMany({}),
    AlertLog.deleteMany({}),
    Issue.deleteMany({}),
    User.deleteMany({}),
  ]);

  for (const account of ACCOUNTS) {
    await User.create({
      name: account.name,
      email: account.email,
      passwordHash: await bcrypt.hash(account.password, 10),
      role: account.role,
    });
  }

  const [issues, users] = await Promise.all([Issue.countDocuments(), User.countDocuments()]);

  console.log("Database cleaned. Accounts ready:");
  for (const account of ACCOUNTS) {
    console.log(`  ${account.email} / ${account.password} (${account.role.toLowerCase()})`);
  }
  console.log(
    `Issues: ${issues}, users: ${users}. No reports or activity seeded — the citizen account is a fresh demo.`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err?.message || err);
  process.exit(1);
});
