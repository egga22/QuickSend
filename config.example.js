// Copy this file to config.js and fill in your RESTDB info.
// If config.js is missing or left as-is, the app will run in local demo mode (no network).

window.RestDBConfig = {
  // Example: https://yourdb-1234.restdb.io/rest
  baseUrl: "https://YOURDB.restdb.io/rest",
  // Generate an API key in your restdb.io dashboard
  apiKey: "YOUR_RESTDB_API_KEY",
  collections: {
    links: "links" // Name of the collection to store links
  }
};

