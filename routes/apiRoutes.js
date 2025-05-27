const express = require('express');
const router = express.Router();
const { fetchRecipes } = require('../utils/api');

const recipesCache = []; // Temporary in-memory storage

// Home page: show list of meals with "Add to Plan" option
router.get('/', async (req, res) => {
  try {
    const data = await fetchRecipes();

    // Filter valid recipes (same as before)
    const filtered = data.filter(r =>
      typeof r.ingredients === 'string' &&
      r.ingredients.trim().length > 0 &&
      typeof r.directions === 'string' &&
      r.directions.trim().length > 0
    );

    // Check for query param ?q=vegan or ?tag=gluten
    const search = (req.query.q || '').toLowerCase();
    const searchedRecipes = search
      ? filtered.filter(r => 
          r.title.toLowerCase().includes(search) ||
          (r.tags && r.tags.toLowerCase().includes(search))
        )
      : filtered;

    recipesCache.length = 0;
    recipesCache.push(...filtered); // cache all, not just filtered ones

    res.render('index', {
      recipes: searchedRecipes,
      planned: req.session.mealPlan || {},
      session: req.session,
      searchTerm: req.query.q || ''
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading recipes");
  }
});

// Detailed meal view
router.get('/meal/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = recipesCache[id];
  if (!recipe) return res.status(404).send('Meal not found');
  res.render('meal', { recipe });
});

// Grocery list: based only on selected/planned meals
router.get('/grocery', (req, res) => {
  const mealPlan = req.session.mealPlan || {};
  let allIds = [];

  // Flatten all recipe IDs from each day
  for (const day in mealPlan) {
    allIds.push(...mealPlan[day]);
  }

  const uniqueIds = [...new Set(allIds)]; // Remove duplicates

  const plannedMeals = uniqueIds.map(id => recipesCache[id]);

  const allIngredients = plannedMeals.flatMap(r => (r.ingredients || "").split('\n'));
  const uniqueIngredients = [...new Set(allIngredients.map(i => i.toLowerCase().trim()))];

  res.render('grocery', { ingredients: uniqueIngredients });
});

// Add meal to weekly plan and store meals by day
router.post('/add-to-plan', (req, res) => {
  const id = parseInt(req.body.id);
  const day = req.body.day;

  if (!req.session.mealPlan) {
    req.session.mealPlan = {
      Monday: [], Tuesday: [], Wednesday: [],
      Thursday: [], Friday: [], Saturday: [], Sunday: []
    };
  }

  if (day && !req.session.mealPlan[day].includes(id)) {
    req.session.mealPlan[day].push(id);
    req.session.message = `Meal added to ${day}'s plan!`;
  } else {
    req.session.message = `Meal already added to ${day}.`;
  }

  res.redirect('/');
});

// Clear all planned meals
router.post('/clear-plan', (req, res) => {
  req.session.plannedMeals = [];
  req.session.message = "Meal plan cleared.";
  res.redirect('/');
});

// Dashboard: show selected meals + their original index
router.get('/dashboard', (req, res) => {
  const mealPlan = req.session.mealPlan || {};
  const weeklyPlan = {};

  for (const day in mealPlan) {
    weeklyPlan[day] = mealPlan[day].map(id => ({
      data: recipesCache[id],
      index: id
    }));
  }

  res.render('dashboard', { weeklyPlan });
});


// Remove one meal from the weekly plan to allow for vegan options or any restrictions
router.post('/remove-from-plan', (req, res) => {
  const idToRemove = parseInt(req.body.id);
  const day = req.body.day;

  if (req.session.mealPlan && req.session.mealPlan[day]) {
    req.session.mealPlan[day] = req.session.mealPlan[day].filter(id => id !== idToRemove);
    req.session.message = `Removed meal from ${day}`;
  }

  res.redirect('/dashboard');
});

// Grocery List Editor Page.Letting users manually remove items from the list
router.get('/grocery/edit', (req, res) => {
  const mealPlan = req.session.mealPlan || {};
  let allIds = [];

  for (const day in mealPlan) {
    allIds.push(...mealPlan[day]);
  }

  const uniqueIds = [...new Set(allIds)];
  const plannedMeals = uniqueIds.map(id => recipesCache[id]);

  const allIngredients = plannedMeals.flatMap(r => (r.ingredients || "").split('\n'));
  const ingredients = [...new Set(allIngredients.map(i => i.toLowerCase().trim()))];

  // Save editable grocery list to session
  if (!req.session.groceryList) {
    req.session.groceryList = ingredients;
  }

  res.render('groceryEdit', { items: req.session.groceryList });
});

//Add POST Route to Remove Selected Items
router.post('/grocery/remove', (req, res) => {
  const itemsToRemove = req.body.removeItems || [];
  const currentList = req.session.groceryList || [];

  // If user removes 1 item, it's a string; otherwise it's an array
  const toRemove = Array.isArray(itemsToRemove) ? itemsToRemove : [itemsToRemove];

  req.session.groceryList = currentList.filter(item => !toRemove.includes(item));
  req.session.message = "Item(s) removed from grocery list.";

  res.redirect('/grocery/edit');
});

module.exports = router;
