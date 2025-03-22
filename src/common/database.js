import { Sequelize } from 'sequelize';

const SequelizeConnection = new Sequelize({
  dialect: 'postgres',
  database: process.env.PG_DATABASE,
  username: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  quoteIdentifiers: false,
});

export default SequelizeConnection;
