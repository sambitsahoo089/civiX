import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Please provide your name" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();
    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "CITIZEN",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("register:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}