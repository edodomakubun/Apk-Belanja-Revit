import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET || "default_secret_key_for_dev";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(userId: string, username: string, role: string, schoolId: string) {
  // Use non-dynamic cookie functions
  const user = { id: userId, username, role, schoolId };
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  const session = await encrypt({ user, expires });

  // Use the awaitable cookies() object
  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function requireAuth() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return session.user;
}
