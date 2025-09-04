# Conference Booking Use Case - MCP Server Setup

This document provides instructions for setting up and running the necessary MCP (Model Context Protocol) servers for the conference booking use case.

## Overview

This use case demonstrates how a series of MCP servers can work together to plan and book a trip to a conference. The process involves finding conference details, searching for flights and hotels, and integrating various services through dedicated MCP tools.

## Required Servers

To run the full workflow as demonstrated in `example.md`, the following servers need to be installed, configured, and running.

---

### 1. Conference Server

This server acts as the main orchestrator for the use case. It contains the `book_conference_prompt` and also provides a geocoding tool that uses the Google Geocoding API.

*   **Location:** `conference/`
*   **Installation:**
    ```bash
    cd conference
    npm install
    npm run build
    ```
*   **Configuration:**
    Create a `.env` file in the `conference/` directory with your Google Cloud API key:
    ```
    GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
    ```

---

### 2. Amadeus Booking Server

This server provides tools for searching for flights and hotels using the Amadeus Self-Service APIs.

*   **Location:** `amadeus-booking-mcp/`
*   **Installation:**
    ```bash
    cd amadeus-booking-mcp
    npm install
    npm run build
    ```
*   **Configuration:**
    Create a `.env` file in the `amadeus-booking-mcp/` directory with your Amadeus API credentials:
    ```
    AMADEUS_CLIENT_ID="YOUR_AMADEUS_CLIENT_ID"
    AMADEUS_CLIENT_SECRET="YOUR_AMADEUS_CLIENT_SECRET"
    ```

---

### 3. Bright Data Search Server

This server is used for performing web searches to find information like conference dates and nearby airports when other methods fail. The official MCP server from Bright Data can be found on GitHub.

*   **GitHub:** [https://github.com/brightdata/brightdata-mcp](https://github.com/brightdata/brightdata-mcp)
*   **Configuration:**
    This server requires an API key from Bright Data. Follow the setup instructions in the official repository.

---

## Usage and MCP Configuration

Instead of running each server in a separate terminal, they should be configured in your `mcp.json` file. This allows your AI assistant (like Cursor) to start and manage the servers automatically.

Add the following entries to the `mcpServers` object in your `mcp.json` file:

```json
{
  "mcpServers": {
    "conference": {
      "command": "node",
      "args": ["<path-to-repository>/Mcp_Server_ConferenceUseCase/conference/build/index.js"]
    },
    "amadeus-booking-mcp": {
      "command": "node",
      "args": ["<path-to-repository>/Mcp_Server_ConferenceUseCase/amadeus-booking-mcp/build/index.js"]
    }
  }
}
```

**Important:**
- Replace `<path-to-repository>` with the absolute path to the directory on your machine.
- If you already have an `mcpServers` object in your `mcp.json`, simply add the `conference` and `amadeus-booking-mcp` servers to it.

**Example Prompt:**

- "i want to go to a conference" 