const { Client } = require("pg");

/**
 * DatabaseConnection class handles PostgreSQL connection management
 * Uses Singleton pattern to ensure only one database connection exists
 */
class DatabaseConnection {
  constructor() {
    // Initialise PostgreSQL client with connection details
    this.client = new Client({
      user: "musicbrainz",
      password: "musicbrainz",
      host: "172.19.0.4",
      port: 5432,
      database: "musicbrainz_db",
    });

    // Track connection state to prevent multiple connection attempts
    this.connected = false;
  }

  /**
   * Establishes connection to the database
   * Only connects if not already connected
   * @returns {Promise<Client>} PostgreSQL client instance
   */
  async connect() {
    if (!this.connected) {
      try {
        console.log("connecting to db");
        // Await the connection to ensure it's established
        await this.client.connect();
        // Mark as connected after successful connection
        this.connected = true;
        console.log("connected to db");
      } catch (error) {
        // Log connection errors with timestamp
        const now = new Date();
        const currentTime = now.toLocaleString();
        console.log(`${currentTime}: Failed to connect to database`);
        // Throw error to be handled by caller
        throw error;
      }
    }
    return this.client;
  }

  /**
   * Returns the PostgreSQL client instance if connected
   * @throws {Error} if database is not connected
   * @returns {Client} PostgreSQL client instance
   */
  getClient() {
    if (!this.connected) {
      throw new Error("Database not connected. Call connect() first");
    }
    return this.client;
  }
}

// Create single instance to be shared across the backend
const db = new DatabaseConnection();

module.exports = db;
