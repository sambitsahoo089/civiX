import { mongoose } from "@/lib/db";
import { CATEGORY_KEYS } from "@/lib/categories";
import { SERVICE_KEYS } from "@/lib/services";

const { Schema } = mongoose;

const STATUS_KEYS = ["REPORTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "REJECTED"];

const statusChangeSchema = new Schema(
  {
    issue: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    fromStatus: { type: String, enum: [...STATUS_KEYS, null], default: null },
    toStatus: { type: String, enum: STATUS_KEYS, required: true },
    note: { type: String, default: null },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One entry per service the citizen or the authority has informed.
const notifiedServiceSchema = new Schema(
  {
    service: { type: String, enum: SERVICE_KEYS, required: true },
    by: { type: String, enum: ["CITIZEN", "AUTHORITY"], default: "CITIZEN" },
    method: { type: String, enum: ["CALL", "FORWARD"], default: "CALL" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const issueSchema = new Schema(
  {
    category: { type: String, enum: CATEGORY_KEYS, required: true },
    emergency: { type: Boolean, default: false },
    description: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: null },
    imageUrl: { type: String, required: true },
    status: { type: String, enum: STATUS_KEYS, default: "REPORTED" },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolvedAt: { type: Date, default: null },
    notifiedServices: { type: [notifiedServiceSchema], default: [] },
  },
  { timestamps: true }
);

issueSchema.index({ status: 1 });
issueSchema.index({ reporter: 1 });
issueSchema.index({ emergency: 1, createdAt: -1 });

// Audit trail of everything sent to the police / ambulance / fire brigade helplines.
const alertLogSchema = new Schema(
  {
    issue: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    kind: { type: String, enum: ["CITIZEN_CALL", "AUTHORITY_FORWARD"], required: true },
    services: { type: [String], enum: SERVICE_KEYS, default: [] },
    triggeredBy: { type: String, enum: [...SERVICE_KEYS, null], default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    channels: {
      type: [
        new Schema(
          {
            channel: { type: String, enum: ["SMS", "EMAIL"], required: true },
            status: { type: String, enum: ["SENT", "SKIPPED", "FAILED"], required: true },
            detail: { type: String, default: null },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    message: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

alertLogSchema.index({ issue: 1, createdAt: -1 });

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["CITIZEN", "AUTHORITY"], default: "CITIZEN" },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Issue = mongoose.models.Issue || mongoose.model("Issue", issueSchema);
export const StatusChange =
  mongoose.models.StatusChange || mongoose.model("StatusChange", statusChangeSchema);
export const AlertLog = mongoose.models.AlertLog || mongoose.model("AlertLog", alertLogSchema);
