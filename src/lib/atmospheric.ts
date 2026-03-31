// Atmospheric detail engine
// Computes poetic details about the moment of writing

export type AtmosphericType =
  | "moon_phase"
  | "golden_blue_hour"
  | "sunset_offset"
  | "poetic_season"
  | "time_of_day"
  | "weather_condition"
  | "temperature";

export type AtmosphericDetail = {
  type: AtmosphericType;
  value: string;
  displayText: string;
};

type WeatherData = {
  condition: string; // "Rain", "Clear", "Clouds", "Snow", etc.
  description: string; // "light rain", "overcast clouds"
  temp: number; // Celsius
  sunrise: number; // Unix timestamp
  sunset: number; // Unix timestamp
};

// ---- Moon Phase ----

function getMoonPhase(date: Date): { name: string; emoji: string } {
  // Synodic month: 29.53059 days
  // Known new moon: Jan 6, 2000 18:14 UTC
  const knownNewMoon = new Date("2000-01-06T18:14:00Z").getTime();
  const synodicMonth = 29.53059;
  const daysSinceNew =
    (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = ((daysSinceNew % synodicMonth) + synodicMonth) % synodicMonth;
  const normalized = phase / synodicMonth; // 0-1

  if (normalized < 0.0625) return { name: "new moon", emoji: "🌑" };
  if (normalized < 0.1875) return { name: "waxing crescent", emoji: "🌒" };
  if (normalized < 0.3125) return { name: "first quarter", emoji: "🌓" };
  if (normalized < 0.4375) return { name: "waxing gibbous", emoji: "🌔" };
  if (normalized < 0.5625) return { name: "full moon", emoji: "🌕" };
  if (normalized < 0.6875) return { name: "waning gibbous", emoji: "🌖" };
  if (normalized < 0.8125) return { name: "last quarter", emoji: "🌗" };
  if (normalized < 0.9375) return { name: "waning crescent", emoji: "🌘" };
  return { name: "new moon", emoji: "🌑" };
}

function moonPhaseDetail(date: Date): AtmosphericDetail {
  const moon = getMoonPhase(date);
  const phrases: Record<string, string> = {
    "new moon": "Under a dark new moon",
    "waxing crescent": "Under a waxing crescent",
    "first quarter": "The moon was half-lit, waxing",
    "waxing gibbous": "Under a waxing gibbous moon",
    "full moon": "Under a full moon",
    "waning gibbous": "The moon was bright, just past full",
    "last quarter": "The moon was half-lit, waning",
    "waning crescent": "Under a thin waning crescent",
  };
  return {
    type: "moon_phase",
    value: moon.name,
    displayText: phrases[moon.name] || `Under a ${moon.name}`,
  };
}

// ---- Poetic Season ----

function poeticSeasonDetail(date: Date, latitude?: number): AtmosphericDetail {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const isSouthern = latitude !== undefined && latitude < 0;

  // Adjust month for southern hemisphere
  const m = isSouthern ? (month + 6) % 12 : month;

  let season: string;
  if (m === 11 || m <= 1) {
    // Winter months
    if (m === 11 && day < 15) season = "the last days of autumn";
    else if (m === 1 && day > 15) season = "the waning days of winter";
    else if (m === 0) season = "the deep of winter";
    else season = "winter";
  } else if (m >= 2 && m <= 4) {
    // Spring months
    if (m === 2 && day < 15) season = "early spring";
    else if (m === 4 && day > 15) season = "the last days of spring";
    else if (m === 3) season = "the middle of spring";
    else season = "spring";
  } else if (m >= 5 && m <= 7) {
    // Summer months
    if (m === 5 && day < 21) season = "the beginning of summer";
    else if (m === 7 && day > 15) season = "the waning days of summer";
    else if (m === 6) season = "the heart of summer";
    else season = "summer";
  } else {
    // Autumn months
    if (m === 8 && day < 21) season = "the last breath of summer";
    else if (m === 8) season = "early autumn";
    else if (m === 10 && day > 15) season = "the last days of autumn";
    else if (m === 9) season = "the middle of autumn";
    else season = "autumn";
  }

  return {
    type: "poetic_season",
    value: season,
    displayText: `It was ${season}`,
  };
}

// ---- Time of Day ----

function timeOfDayDetail(now: Date, sunrise: number, sunset: number): AtmosphericDetail {
  const nowUnix = Math.floor(now.getTime() / 1000);
  const hour = now.getHours();

  const morningPhrases = [
    "The morning was soft",
    "The morning light was gentle",
    "The morning air was still",
    "The morning had a quiet glow",
    "The morning was unhurried",
    "The morning was tender",
  ];

  const afternoonPhrases = [
    "The afternoon was creamy",
    "The afternoon light was warm",
    "The afternoon was languid",
    "The afternoon stretched out gently",
    "The afternoon was golden and slow",
    "The afternoon was draped in light",
  ];

  const eveningPhrases = [
    "The evening was settling in",
    "The evening air was cool and quiet",
    "The evening had a violet hue",
    "The evening was winding down softly",
    "The evening was gentle",
    "The evening was dimming sweetly",
  ];

  const nightPhrases = [
    "The night was deep and still",
    "The night was quiet",
    "The night wrapped everything in silence",
    "The night was soft and dark",
    "The night was velvet",
    "The night hummed faintly",
  ];

  let phrases: string[];
  let period: string;

  if (nowUnix < sunrise) {
    phrases = nightPhrases;
    period = "night";
  } else if (hour < 12) {
    phrases = morningPhrases;
    period = "morning";
  } else if (hour < 17) {
    phrases = afternoonPhrases;
    period = "afternoon";
  } else if (nowUnix < sunset + 3600) {
    phrases = eveningPhrases;
    period = "evening";
  } else {
    phrases = nightPhrases;
    period = "night";
  }

  const displayText = phrases[Math.floor(Math.random() * phrases.length)];

  return {
    type: "time_of_day",
    value: period,
    displayText,
  };
}

// ---- Golden / Blue Hour ----

function goldenBlueHourDetail(
  now: Date,
  sunrise: number,
  sunset: number
): AtmosphericDetail | null {
  const nowUnix = Math.floor(now.getTime() / 1000);

  // Golden hour: ~30 min before/after sunrise and sunset
  // Blue hour: ~30 min before sunrise and after sunset
  const sunriseTime = sunrise;
  const sunsetTime = sunset;

  // Morning blue hour: 30 min before sunrise
  if (nowUnix >= sunriseTime - 1800 && nowUnix < sunriseTime) {
    return {
      type: "golden_blue_hour",
      value: "blue hour (morning)",
      displayText: "Written in the blue hour before dawn",
    };
  }

  // Morning golden hour: sunrise to 45 min after
  if (nowUnix >= sunriseTime && nowUnix < sunriseTime + 2700) {
    return {
      type: "golden_blue_hour",
      value: "golden hour (morning)",
      displayText: "Written in the golden light of morning",
    };
  }

  // Evening golden hour: 45 min before sunset to sunset
  if (nowUnix >= sunsetTime - 2700 && nowUnix < sunsetTime) {
    return {
      type: "golden_blue_hour",
      value: "golden hour (evening)",
      displayText: "Written during the golden hour",
    };
  }

  // Evening blue hour: sunset to 30 min after
  if (nowUnix >= sunsetTime && nowUnix < sunsetTime + 1800) {
    return {
      type: "golden_blue_hour",
      value: "blue hour (evening)",
      displayText: "Written in the blue hour after sunset",
    };
  }

  return null;
}

// ---- Sunset Offset ----

function sunsetOffsetDetail(
  now: Date,
  sunrise: number,
  sunset: number
): AtmosphericDetail {
  const nowUnix = Math.floor(now.getTime() / 1000);

  if (nowUnix < sunrise) {
    const minutesBefore = Math.round((sunrise - nowUnix) / 60);
    if (minutesBefore < 60) {
      return {
        type: "sunset_offset",
        value: `${minutesBefore}m before sunrise`,
        displayText: `The sun would rise in ${minutesBefore} minutes`,
      };
    }
    return {
      type: "sunset_offset",
      value: "before sunrise",
      displayText: "The sun had not yet risen",
    };
  }

  if (nowUnix < sunset) {
    const minutesAfterRise = Math.round((nowUnix - sunrise) / 60);
    if (minutesAfterRise < 90) {
      return {
        type: "sunset_offset",
        value: `${minutesAfterRise}m after sunrise`,
        displayText: `The sun had risen ${minutesAfterRise} minutes ago`,
      };
    }
    // Midday - use sunset countdown
    const minutesToSet = Math.round((sunset - nowUnix) / 60);
    if (minutesToSet < 90) {
      return {
        type: "sunset_offset",
        value: `${minutesToSet}m until sunset`,
        displayText:
          minutesToSet < 60
            ? `The sun would set in ${minutesToSet} minutes`
            : `About an hour until sunset`,
      };
    }
    return {
      type: "sunset_offset",
      value: "daytime",
      displayText: "The sun was high",
    };
  }

  // After sunset
  const minutesAfterSet = Math.round((nowUnix - sunset) / 60);
  if (minutesAfterSet < 120) {
    return {
      type: "sunset_offset",
      value: `${minutesAfterSet}m after sunset`,
      displayText: `The sun had set ${minutesAfterSet} minutes ago`,
    };
  }
  return {
    type: "sunset_offset",
    value: "night",
    displayText: "The sun had long since set",
  };
}

// ---- Weather Condition ----

function weatherConditionDetail(
  weather: WeatherData,
  now: Date,
  sunset: number,
  locationName?: string
): AtmosphericDetail {
  const isNight = Math.floor(now.getTime() / 1000) > sunset;
  const timeWord = isNight ? "night" : "day";
  const skyWord = isNight ? "the moon was" : "the sky was";
  const loc = locationName ? ` in ${locationName}` : "";

  const condition = weather.condition.toLowerCase();
  const desc = weather.description.toLowerCase();

  let displayText: string;

  if (condition === "rain" || condition === "drizzle") {
    if (desc.includes("light")) {
      displayText = isNight
        ? `A light rain was falling and ${skyWord} hidden${loc}`
        : `A light rain was falling outside${loc}`;
    } else if (desc.includes("heavy")) {
      displayText = `The rain was pouring outside${isNight ? " and the moon was high" : ""}${loc}`;
    } else {
      displayText = `The rain fell softly outside${loc}`;
    }
  } else if (condition === "snow") {
    displayText = `The snow was falling quietly${loc}`;
  } else if (condition === "thunderstorm") {
    displayText = `A storm was passing through${loc}`;
  } else if (condition === "clear") {
    displayText = isNight
      ? `The sky was clear and full of stars${loc}`
      : `The sky was clear and bright${loc}`;
  } else if (condition === "clouds") {
    if (desc.includes("overcast")) {
      displayText = `The sky was overcast${loc}`;
    } else if (desc.includes("few") || desc.includes("scattered")) {
      displayText = isNight
        ? `A few clouds drifted across the ${timeWord} sky${loc}`
        : `Clouds drifted lazily across the sky${loc}`;
    } else {
      displayText = `The sky was cloudy${loc}`;
    }
  } else if (condition === "mist" || condition === "fog" || condition === "haze") {
    displayText = isNight
      ? `A mist had settled over the ${timeWord}${loc}`
      : `The morning was wrapped in mist${loc}`;
  } else {
    displayText = `The weather was ${desc}${loc}`;
  }

  return {
    type: "weather_condition",
    value: `${weather.condition}: ${weather.description}`,
    displayText,
  };
}

// ---- Temperature ----

function temperatureDetail(temp: number): AtmosphericDetail {
  const rounded = Math.round(temp);
  let displayText: string;

  if (rounded <= -10) displayText = `It was bitterly cold, C${rounded}°`;
  else if (rounded <= 0) displayText = `The air was freezing, C${rounded}°`;
  else if (rounded <= 5) displayText = `A cold C${rounded}° outside`;
  else if (rounded <= 12) displayText = `A cool C${rounded}° in the air`;
  else if (rounded <= 18) displayText = `A mild C${rounded}° outside`;
  else if (rounded <= 24) displayText = `A pleasant C${rounded}°`;
  else if (rounded <= 30) displayText = `A warm C${rounded}° outside`;
  else if (rounded <= 35) displayText = `A hot C${rounded}° in the air`;
  else displayText = `A sweltering C${rounded}° outside`;

  return {
    type: "temperature",
    value: `${rounded}°C`,
    displayText,
  };
}

// ---- Main: Generate atmospheric details ----

export type AtmosphericInput = {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  weather?: WeatherData;
};

export function generateAtmosphericDetails(
  input: AtmosphericInput
): AtmosphericDetail[] {
  const now = new Date();
  const hasWeather = !!input.weather;
  const count = Math.random() < 0.5 ? 2 : 3;

  if (hasWeather && input.weather) {
    const w = input.weather;

    // Priority pool: weather condition, temperature, golden/blue hour, sunset offset
    // These are the most evocative and should be picked first when available
    const priority: AtmosphericDetail[] = [];
    priority.push(
      weatherConditionDetail(w, now, w.sunset, input.locationName)
    );
    priority.push(temperatureDetail(w.temp));

    const gbh = goldenBlueHourDetail(now, w.sunrise, w.sunset);
    if (gbh) priority.push(gbh);

    priority.push(sunsetOffsetDetail(now, w.sunrise, w.sunset));

    // Secondary pool: moon phase, poetic season, day length
    // These fill remaining slots
    const secondary: AtmosphericDetail[] = [];
    secondary.push(moonPhaseDetail(now));
    secondary.push(poeticSeasonDetail(now, input.latitude));
    secondary.push(timeOfDayDetail(now, w.sunrise, w.sunset));

    // Pick 1-2 from priority, fill rest from secondary
    const shuffledPriority = shuffle(priority);
    const shuffledSecondary = shuffle(secondary);

    const priorityCount = Math.min(
      count === 2 ? 1 : 2,
      shuffledPriority.length
    );
    const selected = [
      ...shuffledPriority.slice(0, priorityCount),
      ...shuffledSecondary.slice(0, count - priorityCount),
    ];

    return selected;
  }

  // No weather — pick from non-weather details only
  const available: AtmosphericDetail[] = [];
  available.push(moonPhaseDetail(now));
  available.push(poeticSeasonDetail(now, input.latitude));

  return shuffleAndPick(available, count);
}

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}
