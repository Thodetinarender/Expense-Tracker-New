require('dotenv').config(); // Load environment variables from .env
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,     // Use DB_NAME from .env
    process.env.DB_USER,     // Use DB_USER from .env
    process.env.DB_PASSWORD, // Use DB_PASSWORD from .env
    {
        dialect: 'mysql',
        host: process.env.DB_HOST,  // Use DB_HOST from .env (RDS Endpoint)
        port: process.env.DB_PORT,  // Use DB_PORT from .env (3306 for AWS RDS)
        logging: false
    }
);

module.exports = sequelize;
