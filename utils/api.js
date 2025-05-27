//aXIOS API logic
// This module exports a function to fetch recipes from an API.
// It uses Axios to make HTTP requests and returns the data.


const axios = require('axios');

const fetchRecipes = async () => {
  const url = 'https://api.sampleapis.com/recipes/recipes';
  const response = await axios.get(url);
  return response.data.slice(0, 7); // Get 7 recipes for the week
};

module.exports = { fetchRecipes };