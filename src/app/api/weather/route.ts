import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    // Return empty weather data if no API key configured
    return NextResponse.json({ available: false });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 min
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({
      available: true,
      condition: data.weather?.[0]?.main || "Clear",
      description: data.weather?.[0]?.description || "clear sky",
      temp: data.main?.temp ?? 20,
      sunrise: data.sys?.sunrise ?? 0,
      sunset: data.sys?.sunset ?? 0,
    });
  } catch {
    return NextResponse.json({ available: false });
  }
}
