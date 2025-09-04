import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// Configure dotenv to load the .env file from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY must be set as an environment variable");
}
const server = new McpServer({
    name: "conference",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
server.registerTool("get_coordinates", {
    description: "Gets the latitude and longitude for a given address using Google Geocoding API.",
    inputSchema: {
        address: z.string().describe("The address to geocode."),
    },
}, async ({ address }) => {
    try {
        const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
                address,
                key: process.env.GOOGLE_API_KEY,
            },
        });
        if (response.data.status === "OK") {
            const location = response.data.results[0].geometry.location;
            return {
                content: [{ type: "text", text: JSON.stringify(location, null, 2) }],
            };
        }
        else {
            return {
                content: [{ type: "text", text: JSON.stringify({ error: response.data.error_message || `Geocoding failed with status: ${response.data.status}` }) }],
            };
        }
    }
    catch (error) {
        const errorMsg = `Google Geocoding API error: ${error.message}`;
        return {
            content: [{ type: "text", text: JSON.stringify({ error: errorMsg }) }],
        };
    }
});
server.registerTool("get_current_date", {
    description: "Gets the current date in YYYY-MM-DD format. Use it when the user asks questions that are date-sensitive.",
    inputSchema: {},
}, async () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    return {
        content: [
            {
                type: "text",
                text: formattedDate,
            },
        ],
    };
});
server.registerPrompt("book_conference_prompt", {
    title: "Book Conference Prompt",
    description: "Generates a prompt for booking a conference. Use it when the user wants to go to a conference.",
    argsSchema: {
        conferenceName: z.string().describe("The name or acronym of the conference (e.g., ISWC)."),
        departureCity: z.string().describe("The city you will be departing from."),
    },
}, async ({ conferenceName, departureCity }) => {
    const promptText = `
Plan my trip to the ${conferenceName} conference, departing from ${departureCity}. Please follow these steps carefully:

1.  **Determine the current date.** This will be the reference for all date-related searches.

2.  **Find Conference Details:** Use the search engine to find the exact dates and location (city, country) of the "${conferenceName}" conference. Search just for the conference name and current year. And then make sure the date is in the future.

3.  **Find Conference Location Coordinates:** Once you have the city for the conference, use the geocoding tool to get its precise latitude and longitude.

4.  **Find Departure Location Coordinates:** Use the geocoding tool to get the latitude and longitude for the departure city: "${departureCity}".

5.  **Identify Airports:**
    *   Find the most relevant airport near the conference location using its coordinates.
    *   Find the most relevant airport near the departure city, "${departureCity}", using its coordinates.

6.  **Search for Flights:**
    *   Search for flight offers between the departure and arrival airports you identified.
    *   The departure date should be scheduled so that I arrive **at least one day before** the conference starts.
    *   Search for a return flight that departs the day after the conference ends.

7.  **Search for Hotels:**
    *   Using the coordinates of the conference location, search for available hotels.
    *   The check-in date should be the arrival date of my flight, and the check-out date should be the departure date of my return flight.

Please present the final itinerary clearly, including flight details and hotel options.
`;
    return {
        messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: promptText,
                },
            }],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("conference MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
