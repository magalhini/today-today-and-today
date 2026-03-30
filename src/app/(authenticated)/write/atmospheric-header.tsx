"use client";

import { useEffect, useState } from "react";

type AtmosphericDetail = {
  type: string;
  value: string;
  displayText: string;
};

export function AtmosphericHeader({
  postId,
  onLocationDetected,
}: {
  postId: number;
  onLocationDetected?: (location: string) => void;
}) {
  const [details, setDetails] = useState<AtmosphericDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setDetails([]);

    async function fetchAtmospheric() {
      try {
        let weather = null;
        let latitude: number | undefined;
        let longitude: number | undefined;
        let locationName: string | undefined;

        // Try to get geolocation
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 8000,
                enableHighAccuracy: false,
              });
            }
          );
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;

          // Reverse geocode for location name
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const geoData = await geoRes.json();
            locationName = [geoData.city, geoData.countryName]
              .filter(Boolean)
              .join(", ");

            if (!cancelled && locationName && onLocationDetected) {
              onLocationDetected(locationName);
            }
          } catch {
            // Ignore geocoding errors
          }

          // Fetch weather
          try {
            const weatherRes = await fetch(
              `/api/weather?lat=${latitude}&lon=${longitude}`
            );
            const weatherData = await weatherRes.json();
            if (weatherData.available) {
              weather = {
                condition: weatherData.condition,
                description: weatherData.description,
                temp: weatherData.temp,
                sunrise: weatherData.sunrise,
                sunset: weatherData.sunset,
              };
            }
          } catch {
            // Continue without weather
          }
        } catch {
          // Geolocation denied or unavailable — continue without
        }

        if (cancelled) return;

        // Generate atmospheric details
        const res = await fetch("/api/atmospheric", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            latitude,
            longitude,
            locationName,
            weather,
          }),
        });

        if (cancelled) return;

        const data = await res.json();
        if (data.details) {
          setDetails(data.details);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAtmospheric();

    return () => {
      cancelled = true;
    };
  }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="mb-8 h-6">
        <span className="text-xs text-charcoal-muted/30 italic font-[family-name:var(--font-body)]">
          Sensing the atmosphere...
        </span>
      </div>
    );
  }

  if (details.length === 0) return null;

  return (
    <div className="mb-8">
      <p className="font-[family-name:var(--font-serif)] italic text-charcoal-muted text-base md:text-lg leading-relaxed">
        {details.map((d, i) => (
          <span key={d.type}>
            {i > 0 && <span className="text-charcoal-muted/40"> · </span>}
            {d.displayText}
          </span>
        ))}
      </p>
    </div>
  );
}
