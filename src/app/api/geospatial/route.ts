import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

let groqClient: Groq | null = null;
function getGroq() {
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
  return groqClient;
}

const GEOSPATIAL_SYSTEM_PROMPT = `You are a geospatial data generation AI. Given a user query about a location or place, you must generate appropriate visualization data.

You MUST respond with valid JSON only. No markdown, no explanation, just JSON.

Determine the type of visualization needed based on the query:
- "deckgl" - For map visualizations with data overlays (heatmaps, scatter plots, arcs, paths, etc.)
- "kepler" - For interactive map exploration with multiple layers and filtering
- "solar" - For solar panel/energy analysis of a building or location
- "site" - For comprehensive site/location analytics with charts

RESPONSE FORMAT for type "deckgl":
{
  "type": "deckgl",
  "config": {
    "title": "string",
    "description": "string",
    "viewState": { "longitude": number, "latitude": number, "zoom": number, "pitch": number, "bearing": number },
    "layers": [
      {
        "id": "string",
        "type": "scatterplot|arc|line|path|polygon|geojson|icon|text|column|point-cloud|heatmap|hexagon|grid|screen-grid|contour|trip|great-circle",
        "visible": true,
        "opacity": 0.8,
        "data": [array of data points with position/coordinates fields],
        "config": {}
      }
    ]
  }
}

RESPONSE FORMAT for type "kepler":
{
  "type": "kepler",
  "config": {
    "title": "string",
    "description": "string",
    "viewState": { "longitude": number, "latitude": number, "zoom": number, "pitch": number, "bearing": number },
    "mapStyle": "dark|light|satellite|voyager",
    "layers": [
      { "id": "string", "type": "point|arc|line|grid|hexbin|heatmap|cluster|icon|polygon|trip|h3|s2|geojson", "label": "string", "visible": true, "color": [r,g,b], "opacity": 0.8 }
    ],
    "data": { "layer-id": [array of data points] },
    "filters": [],
    "interactions": { "tooltip": true, "brush": false, "geocoder": true, "coordinate": true }
  }
}

RESPONSE FORMAT for type "solar":
{
  "type": "solar",
  "data": {
    "location": { "latitude": number, "longitude": number, "address": "string", "country": "string" },
    "building": { "roofArea": number, "roofType": "flat|gabled|hip|mansard", "roofTilt": number, "orientation": "south|north|east|west|southeast|southwest", "stories": number },
    "solar": {
      "annualIrradiance": number (kWh/m²/yr),
      "peakSunHours": number,
      "monthlyIrradiance": [12 numbers],
      "optimalTilt": number,
      "optimalAzimuth": number,
      "shadingFactor": number (0-1),
      "annualFlux": number,
      "monthlyFlux": [12 numbers]
    },
    "panels": { "count": number, "wattage": number, "efficiency": number (%), "tilt": number, "azimuth": number, "degradationRate": number (%), "costPerPanel": number, "installationCost": number },
    "financial": {
      "electricityRate": number ($/kWh),
      "feedInTariff": number,
      "netMetering": boolean,
      "incentives": number,
      "annualSavings": number,
      "paybackYears": number,
      "roi": number (%),
      "lifetimeSavings": number,
      "costWithSolar": number,
      "costWithoutSolar": number,
      "breakEvenYear": number
    },
    "environmental": { "co2Offset": number (tons), "treesEquivalent": number, "carsRemoved": number, "homesEquivalent": number },
    "energyProduction": {
      "annualKwh": number,
      "monthlyKwh": [12 numbers],
      "dailyAvgKwh": number,
      "selfConsumption": number,
      "gridExport": number
    }
  }
}

RESPONSE FORMAT for type "site":
{
  "type": "site",
  "data": {
    "location": { "name": "string", "country": "string", "latitude": number, "longitude": number },
    "demographics": { "population": number, "density": number, "medianAge": number, "growthRate": number, "urbanization": number,
      "ageDistribution": [{ "category": "0-14", "value": number }, ...],
      "incomeDistribution": [{ "category": "Low", "value": number }, ...]
    },
    "climate": {
      "avgTemperature": number, "avgRainfall": number, "avgSunshine": number, "airQualityIndex": number, "windSpeed": number, "humidity": number,
      "monthlyTemperature": [{ "x": "Jan", "y": number }, ...],
      "monthlyRainfall": [{ "month": "Jan", "value": number }, ...]
    },
    "economy": {
      "gdpPerCapita": number, "unemploymentRate": number, "avgIncome": number, "costOfLiving": number,
      "sectorBreakdown": [{ "id": "Services", "label": "Services", "value": number }, ...],
      "growthTrend": [{ "x": "2020", "y": number }, ...]
    },
    "infrastructure": {
      "transportScore": number, "healthcareScore": number, "educationScore": number, "internetSpeed": number, "greenSpacePercent": number,
      "scores": [{ "metric": "Transport", "value": number }, ...]
    },
    "energy": {
      "renewablePercent": number, "solarPotential": number, "windPotential": number, "electricityPrice": number,
      "sourceBreakdown": [{ "id": "Solar", "label": "Solar", "value": number }, ...],
      "consumptionTrend": [{ "x": "2020", "y": number }, ...]
    },
    "customCharts": [
      { "type": "bar|line|pie|radar|heatmap|sunburst|treemap|radial-bar|funnel|calendar|stream|scatter", "title": "string", "description": "string", "data": [...], "config": {} }
    ]
  }
}

IMPORTANT RULES:
- Use REALISTIC data based on actual knowledge of the location
- Include proper lat/lng coordinates for the actual location
- For deckgl/kepler maps: generate 10-30 realistic data points around the location
- For solar: use realistic solar irradiance values based on the location's climate
- For site analytics: use realistic demographic, economic, and climate data
- Generate multiple layer types when appropriate to showcase features
- The data should make geographical sense (correct hemisphere, climate zone, etc.)
- Make the visualizations informative and interesting
- For scatterplot/point data, each point needs: { position: [lng, lat], name: "string", value: number }
- For arc data: { source: [lng, lat], target: [lng, lat], name: "string" }
- For path/trip data: { path: [[lng, lat], ...], name: "string" }
- For hexagon/grid/heatmap data: { position: [lng, lat], weight: number }`;

export async function POST(req: NextRequest) {
  try {
    const { query, conversationContext } = await req.json();

    const userPrompt = `User query: "${query}"
${conversationContext ? `Conversation context: ${conversationContext}` : ""}

Generate the appropriate geospatial/analytics visualization data for this query. Respond with valid JSON only.`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: GEOSPATIAL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Geospatial API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
