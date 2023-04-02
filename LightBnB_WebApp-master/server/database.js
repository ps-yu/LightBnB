const properties = require('./json/properties.json');
const users = require('./json/users.json');
/* 
Connecting to POSTGRES
*/

const { Pool } = require('pg');
const { result } = require('lodash');
const pool = new Pool({
  user: 'labber',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

const getUserWithEmail = function(email){
  return pool
    .query(`SELECT name,email, id, password from users where email = $1`,  [email])
    .then((result) => {
      if ((result.rows).length === 0){
        return null;
      }
      else {
        return result.rows[0];
      }
    })
    .catch((err) => {
      console.log(err.message)
    }); 
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT name, email, id, password from users where id = $1`, [id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    })
}
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {

  return pool
    .query(`INSERT INTO users (
    name, email, password) 
    VALUES ($1, $2, $3)
    RETURNING *`, [user.name, user.email, user.password])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.addUser = addUser;
/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
  .query(`SELECT properties.*
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $2
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $1;`,[limit,guest_id])
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message)
  })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1 
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city LIKE $${queryParams.length} `;
  }
  //4
  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night)*100);
    queryString += `AND cost_per_night >= $${queryParams.length} `;
  }
  //5
  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night)*100);
    queryString += `AND cost_per_night <= $${queryParams.length} `;
  }
  //6
  queryString += `
  GROUP BY properties.id
  `;
  //7
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += `having avg(property_reviews.rating)  >= $${queryParams.length} `;
  }
  queryParams.push(limit);
  queryString += `ORDER BY cost_per_night
  LIMIT $${queryParams.length};`
  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};



exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {

  return pool
    .query(`INSERT INTO properties (
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *`, [
      property.owner_id,
      property.title,
      property.description,
      property.thumbnail_photo_url,
      property.cover_photo_url,
      property.cost_per_night,
      property.street,
      property.city,
      property.province,
      property.post_code,
      property.country,
      property.parking_spaces,
      property.number_of_bathrooms,
      property.number_of_bedrooms
    ])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.addProperty = addProperty;
