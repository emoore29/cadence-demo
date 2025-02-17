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
      host: "db",
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
        console.log("Attempting database connection...");
        // Await the connection to ensure it's established
        await this.client.connect();
        // Mark as connected after successful connection
        this.connected = true;
        console.log("Database connection successful");
      } catch (error) {
        // Log connection errors with timestamp
        const now = new Date();
        const currentTime = now.toLocaleString();
        console.log(
          `${currentTime}: Failed to connect to database`,
          error.message
        );
        // Throw error to be handled by caller
        throw error;
      }
    }
    return this.client;
  }
}

// Create single instance to be shared across the backend
const db = new DatabaseConnection();

module.exports = db;
