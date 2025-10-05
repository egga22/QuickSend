// Copy this file to config.js and fill in your RESTDB info.
// If config.js is missing or left as-is, the app will run in local demo mode (no network).

window.RestDBConfig = {
  // Example: https://yourdb-1234.restdb.io/rest
  baseUrl: "https://quicklinksend-5db7.restdb.io",
  // Generate an API key in your restdb.io dashboard
  apiKey: "68e2ca3f7f34ed4e51200a2a",
  collections: {
    links: "links" // Name of the collection to store links
  }
};

