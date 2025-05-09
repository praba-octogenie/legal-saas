import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Import models one by one to see which one causes the issue
console.log('Importing Tenant model...');
import { Tenant } from '../models/tenant.model';

console.log('Importing User model...');
import { User } from '../models/user.model';

console.log('Importing Client model...');
import { Client } from '../models/client.model';

console.log('Importing Case model...');
import { Case } from '../models/case.model';

console.log('Importing Communication models...');
import { Message, Conversation, Notification } from '../models/communication.model';

console.log('All models imported successfully!');

// Create a simple Sequelize instance
const testConnection = async () => {
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: 'postgres', // Use postgres database to avoid needing to create a new one
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      logging: false,
    });

    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Add models explicitly
    sequelize.addModels([
      Tenant,
      User,
      Client,
      Case,
      Message,
      Conversation,
      Notification
    ]);

    console.log('Models added successfully');

    // Close connection
    await sequelize.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error testing connection:', error);
  }
};

// Run the test
testConnection();