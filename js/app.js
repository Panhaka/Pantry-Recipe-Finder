// Pantry — recipe finder
// Data source: TheMealDB (free public API, no key required for these endpoints)
const API_BASE = 'https://www.themealdb.com/api/json/v1/1';
const FAVORITES_KEY = 'pantry_favorites';

// ---------- State ----------
let ingredients = [];
let currentTab = 'search';

// ---------- DOM refs ----------
const form = document.getElementById('search-form');
const input = document.getElementById('ingredient-input');
const tagsWrap = document.getElementById('ingredient-tags');
const resultsWrap = document.getElementById('results');
const emptyState = document.getElementById('empty-state');
const statusLine = document.getElementById('status-line');
const favCountEl = document.getElementById('fav-count');
const tabSearchBtn = document.getElementById('tab-search');
const tabFavoritesBtn = document.getElementById('tab-favorites');
const modal = document.getElementById('modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

// ---------- Favorites (localStorage) ----------
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable (private browsing etc) — fail silently
  }
  updateFavCount();
}

function isFavorite(id) {
  return getFavorites().some((r) => r.id === id);
}

function toggleFavorite(recipe) {
  const list = getFavorites();
  const idx = list.findIndex((r) => r.id === recipe.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(recipe);
  }
  saveFavorites(list);
}

function updateFavCount() {
  const count = getFavorites().length;
  favCountEl.textContent = count > 0 ? `(${count})` : '';
}

// ---------- Ingredient tags ----------
function renderTags() {
  tagsWrap.innerHTML = '';
  ingredients.forEach((ing, i) => {
    const tag = document.createElement('span');
    tag.className = 'ingredient-tag';
    tag.innerHTML = `${escapeHtml(ing)} <button type="button" aria-label="Remove ${escapeHtml(ing)}">✕</button>`;
    tag.querySelector('button').addEventListener('click', () => {
      ingredients.splice(i, 1);
      renderTags();
    });
    tagsWrap.appendChild(tag);
  });
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = input.value.trim().toLowerCase();
    if (val && !ingredients.includes(val)) {
      ingredients.push(val);
      renderTags();
    }
    input.value = '';
  }
});

// ---------- Search ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const val = input.value.trim().toLowerCase();
  if (val && !ingredients.includes(val)) {
    ingredients.push(val);
    renderTags();
    input.value = '';
  }
  if (ingredients.length === 0) return;
  switchTab('search');
  await searchByIngredient(ingredients[0]);
});

async function searchByIngredient(ingredient) {
  setStatus(`Searching for recipes with ${ingredient}…`);
  showSkeletons();
  try {
    const res = await fetch(`${API_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    const meals = data.meals || [];
    if (meals.length === 0) {
      setStatus(`No recipes found for "${ingredient}". Try a different ingredient.`);
      renderResults([]);
      return;
    }
    setStatus(`${meals.length} recipe${meals.length === 1 ? '' : 's'} found with ${ingredient}${ingredients.length > 1 ? ' (other ingredients are shown but not yet used to filter)' : ''}.`);
    renderResults(
      meals.map((m) => ({
        id: m.idMeal,
        name: m.strMeal,
        thumb: m.strMealThumb,
      }))
    );
  } catch (err) {
    setStatus('Something went wrong reaching the recipe database. Check your connection and try again.');
    renderResults([]);
  }
}

function setStatus(msg) {
  statusLine.textContent = msg;
  statusLine.classList.toggle('hidden', !msg);
}

function showSkeletons() {
  resultsWrap.innerHTML = '';
  emptyState.classList.add('hidden');
  for (let i = 0; i < 6; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton-card';
    resultsWrap.appendChild(sk);
  }
}

function renderResults(meals) {
  resultsWrap.innerHTML = '';
  if (meals.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  meals.forEach((meal) => {
    resultsWrap.appendChild(buildCard(meal));
  });
}

function buildCard(meal) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  const saved = isFavorite(meal.id);
  card.innerHTML = `
    <img class="thumb" src="${meal.thumb}" alt="${escapeHtml(meal.name)}" loading="lazy" />
    <button class="save-btn ${saved ? 'saved' : ''}" aria-label="Save recipe" data-id="${meal.id}">${saved ? '♥' : '♡'}</button>
    <div class="p-4">
      <h3 class="font-display text-lg leading-snug">${escapeHtml(meal.name)}</h3>
    </div>
  `;
  card.querySelector('img').addEventListener('click', () => openRecipe(meal.id));
  card.querySelector('h3').addEventListener('click', () => openRecipe(meal.id));
  const saveBtn = card.querySelector('.save-btn');
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(meal);
    saveBtn.classList.toggle('saved');
    saveBtn.textContent = saveBtn.classList.contains('saved') ? '♥' : '♡';
    if (currentTab === 'favorites') renderFavorites();
  });
  return card;
}

// ---------- Recipe detail modal ----------
async function openRecipe(id) {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modalBackdrop.classList.remove('hidden');
  modalContent.innerHTML = `<p class="text-ink/50 py-10 text-center">Loading recipe…</p>`;
  try {
    const res = await fetch(`${API_BASE}/lookup.php?i=${encodeURIComponent(id)}`);
    const data = await res.json();
    const meal = data.meals && data.meals[0];
    if (!meal) {
      modalContent.innerHTML = `<p class="text-ink/60 py-10 text-center">Recipe details unavailable.</p>`;
      return;
    }
    renderModal(meal);
  } catch {
    modalContent.innerHTML = `<p class="text-ink/60 py-10 text-center">Couldn't load this recipe. Try again.</p>`;
  }
}

function renderModal(meal) {
  const rows = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      rows.push(`<div class="modal-ingredient-row"><span>${escapeHtml(ing)}</span><span class="text-ink/60">${escapeHtml(measure || '')}</span></div>`);
    }
  }
  const saved = isFavorite(meal.idMeal);
  modalContent.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}" class="w-full aspect-video object-cover rounded-lg mb-5" />
    <div class="flex items-start justify-between gap-4">
      <h2 class="font-display text-2xl leading-tight">${escapeHtml(meal.strMeal)}</h2>
      <button id="modal-save" class="shrink-0 px-4 py-2 rounded-lg border-2 ${saved ? 'border-rust text-rust' : 'border-ink/15 text-ink/70'} text-sm font-medium transition-colors">
        ${saved ? '♥ Saved' : '♡ Save'}
      </button>
    </div>
    <p class="text-sm text-ink/50 mt-1">${escapeHtml(meal.strCategory || '')}${meal.strArea ? ' · ' + escapeHtml(meal.strArea) : ''}</p>

    <h3 class="font-display text-lg mt-6 mb-2">Ingredients</h3>
    <div>${rows.join('')}</div>

    <h3 class="font-display text-lg mt-6 mb-2">Instructions</h3>
    <p class="text-sm leading-relaxed text-ink/80 whitespace-pre-line">${escapeHtml(meal.strInstructions || '')}</p>
  `;
  document.getElementById('modal-save').addEventListener('click', (e) => {
    toggleFavorite({ id: meal.idMeal, name: meal.strMeal, thumb: meal.strMealThumb });
    const nowSaved = isFavorite(meal.idMeal);
    e.target.textContent = nowSaved ? '♥ Saved' : '♡ Save';
    e.target.classList.toggle('border-rust', nowSaved);
    e.target.classList.toggle('text-rust', nowSaved);
    e.target.classList.toggle('border-ink/15', !nowSaved);
    e.target.classList.toggle('text-ink/70', !nowSaved);
    if (currentTab === 'favorites') renderFavorites();
  });
}

function closeModal() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  modalBackdrop.classList.add('hidden');
}
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ---------- Tabs ----------
function switchTab(tab) {
  currentTab = tab;
  tabSearchBtn.classList.toggle('active', tab === 'search');
  tabFavoritesBtn.classList.toggle('active', tab === 'favorites');
  if (tab === 'favorites') {
    renderFavorites();
  } else {
    setStatus('');
    renderResults([]);
    resultsWrap.innerHTML = '';
    emptyState.classList.toggle('hidden', ingredients.length === 0 ? false : true);
    if (ingredients.length === 0) emptyState.classList.remove('hidden');
  }
}

function renderFavorites() {
  const favs = getFavorites();
  setStatus(favs.length ? `${favs.length} saved recipe${favs.length === 1 ? '' : 's'}.` : '');
  if (favs.length === 0) {
    resultsWrap.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p.font-display').textContent = 'No saved recipes yet';
    emptyState.querySelector('p.mt-2').textContent = 'Tap the heart on any recipe to save it here.';
    return;
  }
  emptyState.classList.add('hidden');
  resultsWrap.innerHTML = '';
  favs.forEach((meal) => resultsWrap.appendChild(buildCard(meal)));
}

tabSearchBtn.addEventListener('click', () => switchTab('search'));
tabFavoritesBtn.addEventListener('click', () => switchTab('favorites'));

// ---------- Utils ----------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Init ----------
switchTab('search');
updateFavCount();
