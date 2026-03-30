import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { posts, atmosphericDetails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateAtmosphericDetails } from "@/lib/atmospheric";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { postId, latitude, longitude, locationName, weather } = body;

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  // Verify post ownership
  const post = db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post || post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if atmospheric details already exist for this post
  const existing = db
    .select()
    .from(atmosphericDetails)
    .where(eq(atmosphericDetails.postId, postId))
    .all();

  if (existing.length > 0) {
    // Already generated — return existing
    return NextResponse.json({
      details: existing.map((d) => ({
        type: d.type,
        value: d.value,
        displayText: d.displayText,
      })),
    });
  }

  // Update post location info
  if (locationName || latitude || longitude) {
    db.update(posts)
      .set({
        locationName: locationName || post.locationName,
        latitude: latitude?.toString() || post.latitude,
        longitude: longitude?.toString() || post.longitude,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(posts.id, postId))
      .run();
  }

  // Generate atmospheric details
  // weather comes pre-cleaned from the client (no 'available' field)
  const details = generateAtmosphericDetails({
    latitude,
    longitude,
    locationName,
    weather: weather && weather.condition ? weather : undefined,
  });

  // Store them
  if (details.length > 0) {
    db.insert(atmosphericDetails)
      .values(
        details.map((d) => ({
          postId,
          type: d.type,
          value: d.value,
          displayText: d.displayText,
        }))
      )
      .run();
  }

  return NextResponse.json({ details });
}
