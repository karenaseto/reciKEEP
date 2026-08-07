import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PLACEHOLDER_IMAGES } from "./data.js?v=2";

const SUPABASE_URL = "https://jjipfusddbyltmiofdqr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaXBmdXNkZGJ5bHRtaW9mZHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjY1MjcsImV4cCI6MjEwMDQ0MjUyN30.HC_G1iI1cBbVRo6usxqvIgsZfq2-wsQU9YUlqbvxRvo";
const RECIPE_READER_ENDPOINT = "https://recikeep-server.onrender.com/api/parse-recipe";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
  authLoading: document.getElementById("authLoading"),
  signedOutGate: document.getElementById("signedOutGate"),
  landingView: document.getElementById("landingView"),
  authView: document.getElementById("authView"),
  landingSignupButton: document.getElementById("landingSignupButton"),
  landingLoginButton: document.getElementById("landingLoginButton"),
  landingNavSignupButton: document.getElementById("landingNavSignupButton"),
  landingNavLoginButton: document.getElementById("landingNavLoginButton"),
  backToLandingButton: document.getElementById("backToLandingButton"),
  gateSignInButton: document.getElementById("gateSignInButton"),
  authViewTitle: document.getElementById("authViewTitle"),
  authViewSubtitle: document.getElementById("authViewSubtitle"),
  emailAuthForm: document.getElementById("emailAuthForm"),
  authEmailInput: document.getElementById("authEmailInput"),
  authPasswordInput: document.getElementById("authPasswordInput"),
  emailAuthError: document.getElementById("emailAuthError"),
  emailAuthNotice: document.getElementById("emailAuthNotice"),
  emailAuthSubmit: document.getElementById("emailAuthSubmit"),
  authSwitchPrompt: document.getElementById("authSwitchPrompt"),
  authSwitchButton: document.getElementById("authSwitchButton"),
  authError: document.getElementById("authError"),
  appShell: document.getElementById("appShell"),
  accountAvatar: document.getElementById("accountAvatar"),
  accountName: document.getElementById("accountName"),
  signOutButton: document.getElementById("signOutButton"),

  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  navAll: document.getElementById("navAll"),
  navFavorites: document.getElementById("navFavorites"),
  navWantToMake: document.getElementById("navWantToMake"),
  navMade: document.getElementById("navMade"),
  countAll: document.getElementById("countAll"),
  countFavorites: document.getElementById("countFavorites"),
  countWantToMake: document.getElementById("countWantToMake"),
  countMade: document.getElementById("countMade"),
  categoryTree: document.getElementById("categoryTree"),
  addCategoryButton: document.getElementById("addCategoryButton"),

  scopeEyebrow: document.getElementById("scopeEyebrow"),
  scopeTitle: document.getElementById("scopeTitle"),
  searchInput: document.getElementById("searchInput"),
  sourceFilter: document.getElementById("sourceFilter"),
  sortSelect: document.getElementById("sortSelect"),
  addRecipeButton: document.getElementById("addRecipeButton"),
  recipesGrid: document.getElementById("recipesGrid"),
  emptyState: document.getElementById("emptyState"),
  emptyStateAddButton: document.getElementById("emptyStateAddButton"),

  recipeDialog: document.getElementById("recipeDialog"),
  recipeForm: document.getElementById("recipeForm"),
  dialogEyebrow: document.getElementById("dialogEyebrow"),
  dialogTitle: document.getElementById("dialogTitle"),
  closeDialogButton: document.getElementById("closeDialogButton"),
  urlInput: document.getElementById("urlInput"),
  fetchButton: document.getElementById("fetchButton"),
  fetchStatus: document.getElementById("fetchStatus"),
  manualEntryLink: document.getElementById("manualEntryLink"),
  formFields: document.getElementById("formFields"),
  titleInput: document.getElementById("titleInput"),
  sourceTypeInput: document.getElementById("sourceTypeInput"),
  categoryInput: document.getElementById("categoryInput"),
  clearCategoryButton: document.getElementById("clearCategoryButton"),
  subcategoryInput: document.getElementById("subcategoryInput"),
  clearSubcategoryButton: document.getElementById("clearSubcategoryButton"),
  imageInput: document.getElementById("imageInput"),
  tagInput: document.getElementById("tagInput"),
  notesInput: document.getElementById("notesInput"),
  favoriteInput: document.getElementById("favoriteInput"),
  wantToMakeInput: document.getElementById("wantToMakeInput"),
  madeInput: document.getElementById("madeInput"),
  formError: document.getElementById("formError"),
  deleteRecipeButton: document.getElementById("deleteRecipeButton"),
  cancelDialogButton: document.getElementById("cancelDialogButton"),
  saveRecipeButton: document.getElementById("saveRecipeButton"),
  recipeCardTemplate: document.getElementById("recipeCardTemplate"),
  confirmDialog: document.getElementById("confirmDialog"),
  confirmDialogMessage: document.getElementById("confirmDialogMessage"),
  confirmDialogCancel: document.getElementById("confirmDialogCancel"),
  confirmDialogConfirm: document.getElementById("confirmDialogConfirm"),
};

let currentUser = null;
let state = { categories: [], subcategories: [], recipes: [] };

const ui = {
  scope: { type: "all" },
  search: "",
  source: "all",
  sort: "newest",
  expanded: new Set(),
  editingRecipeId: null,
};

let categoryDropdown = null;
let subcategoryDropdown = null;
let sourceTypeDropdown = null;
let sourceFilterDropdown = null;
let sortDropdown = null;

// ---------- confirm dialog ----------

function showConfirmDialog(message, { confirmLabel = "Delete" } = {}) {
  return new Promise((resolve) => {
    els.confirmDialogMessage.textContent = message;
    els.confirmDialogConfirm.textContent = confirmLabel;
    els.confirmDialog.showModal();

    const cleanup = (result) => {
      els.confirmDialog.close();
      els.confirmDialogConfirm.removeEventListener("click", onConfirm);
      els.confirmDialogCancel.removeEventListener("click", onCancel);
      els.confirmDialog.removeEventListener("cancel", onCancel);
      resolve(result);
    };
    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);

    els.confirmDialogConfirm.addEventListener("click", onConfirm);
    els.confirmDialogCancel.addEventListener("click", onCancel);
    els.confirmDialog.addEventListener("cancel", onCancel);
  });
}

// ---------- auth ----------

function showAuthError(message) {
  els.authError.textContent = message;
  els.authError.classList.remove("hidden");
  setTimeout(() => els.authError.classList.add("hidden"), 5000);
}

function showApp() {
  els.authLoading.classList.add("hidden");
  els.signedOutGate.classList.add("hidden");
  els.appShell.classList.remove("hidden");
}

function showSignedOut() {
  els.authLoading.classList.add("hidden");
  els.appShell.classList.add("hidden");
  els.signedOutGate.classList.remove("hidden");
  showLanding();
}

function showLanding() {
  els.landingView.classList.remove("hidden");
  els.authView.classList.add("hidden");
}

let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";
  els.authViewTitle.textContent = isSignup ? "Create your account" : "Log in";
  els.authViewSubtitle.textContent = isSignup
    ? "Save your recipes and access them from any device."
    : "Welcome back — sign in to see your saved recipes.";
  els.emailAuthSubmit.textContent = isSignup ? "Create account" : "Log in";
  els.authSwitchPrompt.textContent = isSignup ? "Already have an account?" : "Don't have an account?";
  els.authSwitchButton.textContent = isSignup ? "Log in" : "Sign up";
  els.emailAuthError.textContent = "";
  els.emailAuthNotice.classList.add("hidden");
  els.emailAuthForm.reset();
}

function showAuthView(mode) {
  setAuthMode(mode || "login");
  els.landingView.classList.add("hidden");
  els.authView.classList.remove("hidden");
}

els.landingSignupButton.addEventListener("click", () => showAuthView("signup"));
els.landingLoginButton.addEventListener("click", () => showAuthView("login"));
els.landingNavSignupButton.addEventListener("click", () => showAuthView("signup"));
els.landingNavLoginButton.addEventListener("click", () => showAuthView("login"));
els.authSwitchButton.addEventListener("click", () => setAuthMode(authMode === "signup" ? "login" : "signup"));
els.backToLandingButton.addEventListener("click", showLanding);

els.emailAuthForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = els.authEmailInput.value.trim();
  const password = els.authPasswordInput.value;
  els.emailAuthError.textContent = "";
  els.emailAuthNotice.classList.add("hidden");
  els.emailAuthSubmit.disabled = true;

  try {
    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.href.split("?")[0].split("#")[0] },
      });
      if (error) {
        els.emailAuthError.textContent = error.message;
      } else if (!data.session) {
        els.emailAuthNotice.textContent = "Check your email to confirm your account, then log in.";
        els.emailAuthNotice.classList.remove("hidden");
        els.emailAuthForm.reset();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) els.emailAuthError.textContent = error.message;
    }
  } finally {
    els.emailAuthSubmit.disabled = false;
  }
});

function renderAccount() {
  if (!currentUser) return;
  const meta = currentUser.user_metadata || {};
  const avatarUrl = meta.avatar_url || meta.picture || "";
  els.accountAvatar.src = avatarUrl;
  els.accountAvatar.style.visibility = avatarUrl ? "visible" : "hidden";
  els.accountName.textContent = meta.full_name || meta.name || currentUser.email || "Account";
}

els.gateSignInButton.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href.split("?")[0].split("#")[0] },
  });
  if (error) showAuthError(error.message);
});

els.signOutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

supabase.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    renderAccount();
    ui.scope = { type: "all" };
    ui.search = "";
    ui.source = "all";
    ui.sort = "newest";
    ui.expanded = new Set();
    els.searchInput.value = "";
    els.sourceFilter.value = "all";
    if (sourceFilterDropdown) sourceFilterDropdown.render();
    els.sortSelect.value = "newest";
    if (sortDropdown) sortDropdown.render();
    await loadAllData();
    showApp();
    renderAll();
  } else {
    state = { categories: [], subcategories: [], recipes: [] };
    showSignedOut();
  }
});

// ---------- emoji auto-detection ----------

const DEFAULT_EMOJI = "🍽️";

const EMOJI_KEYWORDS = [
  { keywords: ["bread", "loaf", "baguette", "toast", "sourdough"], emoji: "🍞" },
  { keywords: ["cookie"], emoji: "🍪" },
  { keywords: ["cake", "cupcake", "birthday"], emoji: "🍰" },
  { keywords: ["pie"], emoji: "🥧" },
  { keywords: ["donut", "doughnut"], emoji: "🍩" },
  { keywords: ["muffin"], emoji: "🧁" },
  { keywords: ["pancake", "waffle"], emoji: "🥞" },
  { keywords: ["breakfast", "brunch"], emoji: "🍳" },
  { keywords: ["dinner", "entree", "main"], emoji: "🍽️" },
  { keywords: ["lunch"], emoji: "🥪" },
  { keywords: ["soup", "stew", "chili"], emoji: "🍲" },
  { keywords: ["salad"], emoji: "🥗" },
  { keywords: ["pasta", "noodle", "spaghetti", "ramen"], emoji: "🍝" },
  { keywords: ["pizza"], emoji: "🍕" },
  { keywords: ["taco", "burrito", "mexican"], emoji: "🌮" },
  { keywords: ["burger"], emoji: "🍔" },
  { keywords: ["sandwich"], emoji: "🥪" },
  { keywords: ["sushi", "japanese"], emoji: "🍣" },
  { keywords: ["curry", "indian"], emoji: "🍛" },
  { keywords: ["chicken"], emoji: "🍗" },
  { keywords: ["beef", "steak"], emoji: "🥩" },
  { keywords: ["pork", "bacon", "ham"], emoji: "🥓" },
  { keywords: ["seafood", "fish", "shrimp", "salmon"], emoji: "🐟" },
  { keywords: ["egg"], emoji: "🥚" },
  { keywords: ["cheese"], emoji: "🧀" },
  { keywords: ["vegetarian", "vegan", "veggie", "vegetable"], emoji: "🥦" },
  { keywords: ["fruit"], emoji: "🍓" },
  { keywords: ["rice"], emoji: "🍚" },
  { keywords: ["snack", "appetizer", "side"], emoji: "🍿" },
  { keywords: ["drink", "beverage", "cocktail", "smoothie", "juice"], emoji: "🥤" },
  { keywords: ["coffee"], emoji: "☕" },
  { keywords: ["tea"], emoji: "🍵" },
  { keywords: ["wine"], emoji: "🍷" },
  { keywords: ["beer"], emoji: "🍺" },
  { keywords: ["ice cream", "gelato"], emoji: "🍨" },
  { keywords: ["chocolate"], emoji: "🍫" },
  { keywords: ["dessert", "sweet", "treat"], emoji: "🍮" },
  { keywords: ["bbq", "barbecue", "grill"], emoji: "🍖" },
  { keywords: ["holiday", "christmas"], emoji: "🎄" },
  { keywords: ["healthy"], emoji: "🥗" },
  { keywords: ["bake", "baking"], emoji: "🧁" },
  { keywords: ["candy", "lollipop", "gummy", "gummies"], emoji: "🍬" },
  { keywords: ["salt", "salty"], emoji: "🧂" },
  { keywords: ["spicy", "hot sauce", "chili pepper"], emoji: "🌶️" },
  { keywords: ["mint"], emoji: "🌿" },
  { keywords: ["gluten free", "gluten-free"], emoji: "🌾" },
  { keywords: ["dairy free", "dairy-free"], emoji: "🥛" },
  { keywords: ["kid", "kids"], emoji: "🧒" },
  { keywords: ["party"], emoji: "🎉" },
  { keywords: ["potato", "fries"], emoji: "🥔" },
  { keywords: ["dip"], emoji: "🫕" },
  { keywords: ["sauce", "condiment", "marinade", "dressing"], emoji: "🥫" },
  { keywords: ["dumpling"], emoji: "🥟" },
  { keywords: ["bagel"], emoji: "🥯" },
  { keywords: ["granola", "cereal", "oatmeal"], emoji: "🥣" },
  { keywords: ["yogurt", "yoghurt"], emoji: "🍦" },
  { keywords: ["brownie"], emoji: "🍫" },
  { keywords: ["biscuit", "scone"], emoji: "🥐" },
  { keywords: ["croissant"], emoji: "🥐" },
  { keywords: ["casserole", "stuffing", "gravy"], emoji: "🍲" },
  { keywords: ["stir fry", "stir-fry", "wok"], emoji: "🥘" },
  { keywords: ["wrap", "pita"], emoji: "🌯" },
  { keywords: ["popcorn", "pretzel", "chips"], emoji: "🍿" },
  { keywords: ["jam", "jelly", "preserve", "pickle", "pickling", "canning"], emoji: "🫙" },
  { keywords: ["instant pot", "slow cooker", "crockpot", "air fryer", "one pot"], emoji: "🍳" },
  { keywords: ["meal prep", "leftover"], emoji: "🥡" },
  { keywords: ["spice", "seasoning", "herb"], emoji: "🌿" },
  { keywords: ["pudding", "custard", "mousse"], emoji: "🍮" },
];

function guessEmoji(name) {
  const lower = name.toLowerCase();
  const match = EMOJI_KEYWORDS.find(({ keywords }) => keywords.some((k) => lower.includes(k)));
  return match ? match.emoji : DEFAULT_EMOJI;
}

// ---------- Supabase <-> app state mapping ----------

function rowToCategory(row) {
  return { id: row.id, name: row.name, emoji: row.emoji || guessEmoji(row.name), createdAt: row.created_at };
}

function rowToSubcategory(row) {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    emoji: row.emoji || guessEmoji(row.name),
    createdAt: row.created_at,
  };
}

function rowToRecipe(row) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    sourceType: row.source_type,
    categoryId: row.category_id || "",
    subcategoryId: row.subcategory_id || "",
    image: row.image || "",
    tag: row.tag || "",
    notes: row.notes || "",
    favorite: row.favorite,
    made: row.made,
    wantToMake: row.want_to_make,
    createdAt: row.created_at,
  };
}

async function loadAllData() {
  const [catRes, subRes, recRes] = await Promise.all([
    supabase.from("categories").select("*").order("created_at", { ascending: true }),
    supabase.from("subcategories").select("*").order("created_at", { ascending: true }),
    supabase.from("recipes").select("*").order("created_at", { ascending: true }),
  ]);

  const firstError = catRes.error || subRes.error || recRes.error;
  if (firstError) showAuthError(firstError.message);

  state = {
    categories: (catRes.data || []).map(rowToCategory),
    subcategories: (subRes.data || []).map(rowToSubcategory),
    recipes: (recRes.data || []).map(rowToRecipe),
  };

  backfillMissingEmojis(catRes.data || [], subRes.data || []);
}

function backfillMissingEmojis(categoryRows, subcategoryRows) {
  categoryRows
    .filter((row) => !row.emoji)
    .forEach((row) => {
      const category = state.categories.find((c) => c.id === row.id);
      if (!category) return;
      supabase
        .from("categories")
        .update({ emoji: category.emoji })
        .eq("id", row.id)
        .then(({ error }) => {
          if (error) console.error("Failed to backfill category emoji", error);
        });
    });

  subcategoryRows
    .filter((row) => !row.emoji)
    .forEach((row) => {
      const sub = state.subcategories.find((s) => s.id === row.id);
      if (!sub) return;
      supabase
        .from("subcategories")
        .update({ emoji: sub.emoji })
        .eq("id", row.id)
        .then(({ error }) => {
          if (error) console.error("Failed to backfill subcategory emoji", error);
        });
    });
}

// ---------- mutations (Supabase-backed) ----------

async function createCategory(name) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, emoji: guessEmoji(name), user_id: currentUser.id })
    .select()
    .single();
  if (error) {
    showAuthError(error.message);
    return null;
  }
  const category = rowToCategory(data);
  state.categories.push(category);
  renderSidebar();
  return category;
}

async function renameCategory(category, newName) {
  const { error } = await supabase.from("categories").update({ name: newName }).eq("id", category.id);
  if (error) {
    showAuthError(error.message);
    return;
  }
  category.name = newName;
  renderSidebar();
  renderTopbar();
}

async function updateCategoryEmoji(category, emoji) {
  category.emoji = emoji;
  renderSidebar();

  const { error } = await supabase.from("categories").update({ emoji }).eq("id", category.id);
  if (error) showAuthError(error.message);
}

async function removeCategory(category) {
  const { error } = await supabase.from("categories").delete().eq("id", category.id);
  if (error) {
    showAuthError(error.message);
    return;
  }

  const subIds = new Set(subcategoriesFor(category.id).map((s) => s.id));
  state.subcategories = state.subcategories.filter((s) => s.categoryId !== category.id);
  state.recipes.forEach((r) => {
    if (r.categoryId === category.id) {
      r.categoryId = "";
      r.subcategoryId = "";
    }
    if (subIds.has(r.subcategoryId)) r.subcategoryId = "";
  });
  state.categories = state.categories.filter((c) => c.id !== category.id);

  if (ui.scope.type === "category" && ui.scope.id === category.id) ui.scope = { type: "all" };
  if (ui.scope.type === "subcategory" && subIds.has(ui.scope.id)) ui.scope = { type: "all" };

  renderAll();
}

async function createSubcategory(categoryId, name) {
  const { data, error } = await supabase
    .from("subcategories")
    .insert({ name, category_id: categoryId, emoji: guessEmoji(name), user_id: currentUser.id })
    .select()
    .single();
  if (error) {
    showAuthError(error.message);
    return null;
  }
  const subcategory = rowToSubcategory(data);
  state.subcategories.push(subcategory);
  renderSidebar();
  return subcategory;
}

async function renameSubcategory(sub, newName) {
  const { error } = await supabase.from("subcategories").update({ name: newName }).eq("id", sub.id);
  if (error) {
    showAuthError(error.message);
    return;
  }
  sub.name = newName;
  renderSidebar();
  renderTopbar();
}

async function updateSubcategoryEmoji(sub, emoji) {
  sub.emoji = emoji;
  renderSidebar();

  const { error } = await supabase.from("subcategories").update({ emoji }).eq("id", sub.id);
  if (error) showAuthError(error.message);
}

async function removeSubcategory(sub) {
  const { error } = await supabase.from("subcategories").delete().eq("id", sub.id);
  if (error) {
    showAuthError(error.message);
    return;
  }
  state.recipes.forEach((r) => {
    if (r.subcategoryId === sub.id) r.subcategoryId = "";
  });
  state.subcategories = state.subcategories.filter((s) => s.id !== sub.id);

  if (ui.scope.type === "subcategory" && ui.scope.id === sub.id) ui.scope = { type: "all" };

  renderAll();
}

async function createRecipe(payload) {
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: currentUser.id,
      title: payload.title,
      url: payload.url,
      source_type: payload.sourceType,
      category_id: payload.categoryId || null,
      subcategory_id: payload.subcategoryId || null,
      image: payload.image,
      tag: payload.tag,
      notes: payload.notes,
      favorite: payload.favorite,
      made: payload.made,
      want_to_make: payload.wantToMake,
    })
    .select()
    .single();
  if (error) {
    els.formError.textContent = error.message;
    return false;
  }
  state.recipes.push(rowToRecipe(data));
  return true;
}

async function updateRecipe(id, payload) {
  const { error } = await supabase
    .from("recipes")
    .update({
      title: payload.title,
      url: payload.url,
      source_type: payload.sourceType,
      category_id: payload.categoryId || null,
      subcategory_id: payload.subcategoryId || null,
      image: payload.image,
      tag: payload.tag,
      notes: payload.notes,
      favorite: payload.favorite,
      made: payload.made,
      want_to_make: payload.wantToMake,
    })
    .eq("id", id);
  if (error) {
    els.formError.textContent = error.message;
    return false;
  }
  const recipe = state.recipes.find((r) => r.id === id);
  Object.assign(recipe, payload);
  return true;
}

async function removeRecipe(id) {
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) {
    showAuthError(error.message);
    return;
  }
  state.recipes = state.recipes.filter((r) => r.id !== id);
}

async function toggleFavorite(recipe) {
  const next = !recipe.favorite;
  recipe.favorite = next;
  renderSidebar();
  renderGrid();

  const { error } = await supabase.from("recipes").update({ favorite: next }).eq("id", recipe.id);
  if (error) {
    recipe.favorite = !next;
    renderSidebar();
    renderGrid();
    showAuthError(error.message);
  }
}

async function toggleMade(recipe) {
  const next = !recipe.made;
  recipe.made = next;
  renderSidebar();
  renderGrid();

  const { error } = await supabase.from("recipes").update({ made: next }).eq("id", recipe.id);
  if (error) {
    recipe.made = !next;
    renderSidebar();
    renderGrid();
    showAuthError(error.message);
  }
}

async function toggleWantToMake(recipe) {
  const next = !recipe.wantToMake;
  recipe.wantToMake = next;
  renderSidebar();
  renderGrid();

  const { error } = await supabase.from("recipes").update({ want_to_make: next }).eq("id", recipe.id);
  if (error) {
    recipe.wantToMake = !next;
    renderSidebar();
    renderGrid();
    showAuthError(error.message);
  }
}

// ---------- derived lookups ----------

function getCategory(id) {
  return state.categories.find((c) => c.id === id) || null;
}

function getSubcategory(id) {
  return state.subcategories.find((s) => s.id === id) || null;
}

function subcategoriesFor(categoryId) {
  return state.subcategories.filter((s) => s.categoryId === categoryId);
}

function recipeCountForCategory(categoryId) {
  return state.recipes.filter((r) => r.categoryId === categoryId).length;
}

function recipeCountForSubcategory(subcategoryId) {
  return state.recipes.filter((r) => r.subcategoryId === subcategoryId).length;
}

// ---------- scope + filtering ----------

function recipesInScope() {
  const { scope } = ui;
  if (scope.type === "all") return state.recipes;
  if (scope.type === "favorites") return state.recipes.filter((r) => r.favorite);
  if (scope.type === "made") return state.recipes.filter((r) => r.made);
  if (scope.type === "wantToMake") return state.recipes.filter((r) => r.wantToMake);
  if (scope.type === "category") return state.recipes.filter((r) => r.categoryId === scope.id);
  if (scope.type === "subcategory")
    return state.recipes.filter((r) => r.subcategoryId === scope.id);
  return state.recipes;
}

function filteredRecipes() {
  let list = recipesInScope();

  if (ui.source !== "all") {
    list = list.filter((r) => r.sourceType === ui.source);
  }

  const q = ui.search.trim().toLowerCase();
  if (q) {
    list = list.filter((r) =>
      [r.title, r.notes, r.tag].filter(Boolean).some((field) => field.toLowerCase().includes(q))
    );
  }

  return list;
}

// ---------- rendering: sidebar ----------

function renderSidebar() {
  els.countAll.textContent = state.recipes.length;
  els.countFavorites.textContent = state.recipes.filter((r) => r.favorite).length;
  els.countWantToMake.textContent = state.recipes.filter((r) => r.wantToMake).length;
  els.countMade.textContent = state.recipes.filter((r) => r.made).length;

  els.navAll.classList.toggle("active", ui.scope.type === "all");
  els.navFavorites.classList.toggle("active", ui.scope.type === "favorites");
  els.navWantToMake.classList.toggle("active", ui.scope.type === "wantToMake");
  els.navMade.classList.toggle("active", ui.scope.type === "made");

  els.categoryTree.innerHTML = "";

  state.categories.forEach((category) => {
    els.categoryTree.appendChild(buildCategoryRow(category));
  });
}

function buildCategoryRow(category) {
  const wrap = document.createElement("div");
  wrap.className = "category-row";
  wrap.dataset.categoryId = category.id;

  const subs = subcategoriesFor(category.id);
  const isExpanded = ui.expanded.has(category.id);

  const main = document.createElement("div");
  main.className = "category-row-main";
  if (ui.scope.type === "category" && ui.scope.id === category.id) {
    main.classList.add("active");
  }

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "toggle-btn" + (subs.length ? "" : " toggle-empty");
  toggleBtn.setAttribute("aria-label", isExpanded ? "Hide subcategories" : "Show subcategories");
  toggleBtn.textContent = isExpanded ? "−" : "+";
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!subs.length) return;
    if (ui.expanded.has(category.id)) ui.expanded.delete(category.id);
    else ui.expanded.add(category.id);
    renderSidebar();
  });

  const emojiSpan = document.createElement("span");
  emojiSpan.className = "category-emoji";
  emojiSpan.textContent = category.emoji;
  emojiSpan.setAttribute("role", "button");
  emojiSpan.setAttribute("aria-label", "Change category emoji");
  emojiSpan.addEventListener("click", (e) => {
    e.stopPropagation();
    startCategoryEmojiEdit(category, emojiSpan, main);
  });

  const nameSpan = document.createElement("span");
  nameSpan.className = "category-name";
  nameSpan.textContent = category.name;

  const countSpan = document.createElement("span");
  countSpan.className = "nav-count";
  countSpan.textContent = recipeCountForCategory(category.id);

  const actions = document.createElement("span");
  actions.className = "row-actions";

  const addSubBtn = iconButton(
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
    "Add subcategory"
  );
  addSubBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    ui.expanded.add(category.id);
    renderSidebar();
    startInlineSubcategoryCreate(category.id);
  });

  const editBtn = iconButton(
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    "Rename category"
  );
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startCategoryRename(category, nameSpan, main);
  });

  const deleteBtn = iconButton(
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    "Delete category"
  );
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteCategory(category);
  });

  actions.append(addSubBtn, editBtn, deleteBtn);
  main.append(toggleBtn, emojiSpan, nameSpan, countSpan, actions);
  main.addEventListener("click", () => selectScope({ type: "category", id: category.id }));

  wrap.appendChild(main);

  const list = document.createElement("div");
  list.className = "subcategory-list" + (isExpanded ? "" : " hidden");
  subs.forEach((sub) => list.appendChild(buildSubcategoryRow(sub)));
  wrap.appendChild(list);

  return wrap;
}

function buildSubcategoryRow(sub) {
  const row = document.createElement("div");
  row.className = "subcategory-row";
  if (ui.scope.type === "subcategory" && ui.scope.id === sub.id) {
    row.classList.add("active");
  }

  const emojiSpan = document.createElement("span");
  emojiSpan.className = "subcategory-emoji";
  emojiSpan.textContent = sub.emoji;
  emojiSpan.setAttribute("role", "button");
  emojiSpan.setAttribute("aria-label", "Change subcategory emoji");
  emojiSpan.addEventListener("click", (e) => {
    e.stopPropagation();
    startSubcategoryEmojiEdit(sub, emojiSpan, row);
  });

  const nameSpan = document.createElement("span");
  nameSpan.className = "subcategory-name";
  nameSpan.textContent = sub.name;

  const countSpan = document.createElement("span");
  countSpan.className = "nav-count";
  countSpan.textContent = recipeCountForSubcategory(sub.id);

  const actions = document.createElement("span");
  actions.className = "row-actions";

  const editBtn = iconButton(
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    "Rename subcategory"
  );
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startSubcategoryRename(sub, nameSpan, row);
  });

  const deleteBtn = iconButton(
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    "Delete subcategory"
  );
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteSubcategory(sub);
  });

  actions.append(editBtn, deleteBtn);
  row.append(emojiSpan, nameSpan, countSpan, actions);
  row.addEventListener("click", () => selectScope({ type: "subcategory", id: sub.id }));

  return row;
}

function iconButton(svg, label) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "row-icon-button";
  btn.setAttribute("aria-label", label);
  btn.innerHTML = svg;
  return btn;
}

function selectScope(scope) {
  ui.scope = scope;
  renderSidebar();
  renderTopbar();
  renderGrid();
  if (window.innerWidth <= 900) closeSidebar();
}

// ---------- inline create/rename ----------

function startCategoryRename(category, nameSpan, container) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit-input";
  input.value = category.name;
  container.replaceChild(input, nameSpan);
  input.focus();
  input.select();

  const commit = () => {
    const value = input.value.trim();
    if (value && value !== category.name) {
      renameCategory(category, value);
    } else {
      renderSidebar();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.value = category.name;
      input.blur();
    }
  });
  input.addEventListener("blur", commit);
  input.addEventListener("click", (e) => e.stopPropagation());
}

function startSubcategoryRename(sub, nameSpan, container) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit-input";
  input.value = sub.name;
  container.replaceChild(input, nameSpan);
  input.focus();
  input.select();

  const commit = () => {
    const value = input.value.trim();
    if (value && value !== sub.name) {
      renameSubcategory(sub, value);
    } else {
      renderSidebar();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.value = sub.name;
      input.blur();
    }
  });
  input.addEventListener("blur", commit);
  input.addEventListener("click", (e) => e.stopPropagation());
}

function startCategoryEmojiEdit(category, emojiSpan, container) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit-input emoji-edit-input";
  input.value = category.emoji;
  container.replaceChild(input, emojiSpan);
  input.focus();
  input.select();

  const commit = () => {
    const value = input.value.trim();
    if (value && value !== category.emoji) {
      updateCategoryEmoji(category, value);
    } else {
      renderSidebar();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.value = category.emoji;
      input.blur();
    }
  });
  input.addEventListener("blur", commit);
  input.addEventListener("click", (e) => e.stopPropagation());
}

function startSubcategoryEmojiEdit(sub, emojiSpan, container) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit-input emoji-edit-input";
  input.value = sub.emoji;
  container.replaceChild(input, emojiSpan);
  input.focus();
  input.select();

  const commit = () => {
    const value = input.value.trim();
    if (value && value !== sub.emoji) {
      updateSubcategoryEmoji(sub, value);
    } else {
      renderSidebar();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.value = sub.emoji;
      input.blur();
    }
  });
  input.addEventListener("blur", commit);
  input.addEventListener("click", (e) => e.stopPropagation());
}

function startInlineSubcategoryCreate(categoryId) {
  const row = [...els.categoryTree.children].find((r) => r.dataset.categoryId === categoryId);
  const list = row && row.querySelector(".subcategory-list");
  if (!list) return;

  const createRow = document.createElement("div");
  createRow.className = "subcategory-row subcategory-row-create";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit-input";
  input.placeholder = "New subcategory";
  createRow.appendChild(input);
  list.appendChild(createRow);
  input.focus();

  const commit = () => {
    const value = input.value.trim();
    if (value) {
      createSubcategory(categoryId, value);
    } else {
      renderSidebar();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.value = "";
      input.blur();
    }
  });
  input.addEventListener("blur", commit);
}

els.addCategoryButton.addEventListener("click", () => {
  const wrap = document.createElement("div");
  wrap.className = "category-row category-row-create";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit-input";
  input.placeholder = "New category";
  wrap.appendChild(input);
  els.categoryTree.appendChild(wrap);
  input.focus();

  const commit = () => {
    const value = input.value.trim();
    if (value) {
      createCategory(value);
    } else {
      renderSidebar();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.value = "";
      input.blur();
    }
  });
  input.addEventListener("blur", commit);
});

async function deleteCategory(category) {
  const subs = subcategoriesFor(category.id);
  const affected = state.recipes.filter((r) => r.categoryId === category.id).length;
  const warning =
    affected || subs.length
      ? `"${category.name}" has ${affected} recipe(s) and ${subs.length} subcategory(ies). Deleting it will move those recipes to Uncategorized. This can't be undone.`
      : `Delete "${category.name}"? This can't be undone.`;
  if (!(await showConfirmDialog(warning))) return;
  removeCategory(category);
}

async function deleteSubcategory(sub) {
  const affected = recipeCountForSubcategory(sub.id);
  const warning = affected
    ? `"${sub.name}" has ${affected} recipe(s). Deleting it will keep those recipes in the main category, just without this subcategory. This can't be undone.`
    : `Delete "${sub.name}"? This can't be undone.`;
  if (!(await showConfirmDialog(warning))) return;
  removeSubcategory(sub);
}

// ---------- rendering: topbar + grid ----------

function renderTopbar() {
  const { scope } = ui;
  if (scope.type === "all") {
    els.scopeEyebrow.textContent = "Browsing";
    els.scopeTitle.textContent = "All Recipes";
  } else if (scope.type === "favorites") {
    els.scopeEyebrow.textContent = "Browsing";
    els.scopeTitle.textContent = "Favorites";
  } else if (scope.type === "wantToMake") {
    els.scopeEyebrow.textContent = "Browsing";
    els.scopeTitle.textContent = "Want to Make";
  } else if (scope.type === "made") {
    els.scopeEyebrow.textContent = "Browsing";
    els.scopeTitle.textContent = "Made";
  } else if (scope.type === "category") {
    const cat = getCategory(scope.id);
    els.scopeEyebrow.textContent = "Category";
    els.scopeTitle.textContent = cat ? cat.name : "Category";
  } else if (scope.type === "subcategory") {
    const sub = getSubcategory(scope.id);
    const parent = sub ? getCategory(sub.categoryId) : null;
    els.scopeEyebrow.textContent = parent ? `In ${parent.name}` : "Subcategory";
    els.scopeTitle.textContent = sub ? sub.name : "Subcategory";
  }
}

function renderGrid() {
  const list = filteredRecipes();
  els.recipesGrid.innerHTML = "";

  if (!list.length) {
    els.emptyState.classList.remove("hidden");
    els.recipesGrid.classList.add("hidden");
    return;
  }
  els.emptyState.classList.add("hidden");
  els.recipesGrid.classList.remove("hidden");

  list
    .slice()
    .sort(sortComparator(ui.sort))
    .forEach((recipe) => els.recipesGrid.appendChild(buildRecipeCard(recipe)));
}

function sortComparator(sort) {
  switch (sort) {
    case "oldest":
      return (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
    case "title-asc":
      return (a, b) => a.title.localeCompare(b.title);
    case "title-desc":
      return (a, b) => b.title.localeCompare(a.title);
    case "newest":
    default:
      return (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  }
}

function buildRecipeCard(recipe) {
  const node = els.recipeCardTemplate.content.firstElementChild.cloneNode(true);

  const img = node.querySelector(".card-image");
  img.src = recipe.image || fallbackImage(recipe.sourceType);
  img.alt = recipe.title;

  const favBtn = node.querySelector(".favorite-chip");
  favBtn.classList.toggle("is-favorite", !!recipe.favorite);
  favBtn.addEventListener("click", () => toggleFavorite(recipe));

  const madeBtn = node.querySelector(".made-chip");
  madeBtn.classList.toggle("is-made", !!recipe.made);
  madeBtn.setAttribute("aria-label", recipe.made ? "Mark as not made" : "Mark as made");
  madeBtn.addEventListener("click", () => toggleMade(recipe));

  const wantBtn = node.querySelector(".want-chip");
  wantBtn.classList.toggle("is-wanted", !!recipe.wantToMake);
  wantBtn.setAttribute("aria-label", recipe.wantToMake ? "Remove from want to make" : "Add to want to make");
  wantBtn.addEventListener("click", () => toggleWantToMake(recipe));

  const category = getCategory(recipe.categoryId);
  const subcategory = getSubcategory(recipe.subcategoryId);

  node.querySelector(".card-category").textContent = category
    ? `${category.emoji} ${category.name}`
    : "Uncategorized";
  node.querySelector(".card-source").textContent = recipe.sourceType;
  node.querySelector(".card-title").textContent = recipe.title;
  node.querySelector(".card-notes").textContent = recipe.notes || "";

  const subEl = node.querySelector(".card-subcategory");
  if (subcategory) {
    subEl.textContent = `${subcategory.emoji} ${subcategory.name}`;
    subEl.classList.remove("hidden");
  }

  const tagEl = node.querySelector(".card-tag");
  if (recipe.tag) {
    tagEl.textContent = recipe.tag;
    tagEl.classList.remove("hidden");
  }

  const openLink = node.querySelector(".open-link");
  openLink.href = recipe.url;

  node.querySelector(".edit-button").addEventListener("click", () => openRecipeDialog("edit", recipe));

  return node;
}

function fallbackImage(sourceType) {
  const bucket = PLACEHOLDER_IMAGES[sourceType] || PLACEHOLDER_IMAGES.Website;
  return bucket[0];
}

function renderAll() {
  renderSidebar();
  renderTopbar();
  renderGrid();
}

// ---------- recipe dialog ----------

function populateCategorySelect(selectedCategoryId) {
  els.categoryInput.innerHTML = "";

  state.categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = `${cat.emoji} ${cat.name}`;
    els.categoryInput.appendChild(opt);
  });
  els.categoryInput.value = selectedCategoryId || "";
  if (categoryDropdown) categoryDropdown.render();
  updateClearCategoryButton();
}

function updateClearCategoryButton() {
  els.clearCategoryButton.classList.toggle("hidden", !els.categoryInput.value);
}

function populateSubcategorySelect(categoryId, selectedSubcategoryId) {
  els.subcategoryInput.innerHTML = "";

  subcategoriesFor(categoryId).forEach((sub) => {
    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = `${sub.emoji} ${sub.name}`;
    els.subcategoryInput.appendChild(opt);
  });
  els.subcategoryInput.value = selectedSubcategoryId || "";
  if (subcategoryDropdown) subcategoryDropdown.render();
  updateClearSubcategoryButton();
}

function updateClearSubcategoryButton() {
  els.clearSubcategoryButton.classList.toggle("hidden", !els.subcategoryInput.value);
}

els.categoryInput.addEventListener("change", () => {
  populateSubcategorySelect(els.categoryInput.value, "");
  updateClearCategoryButton();
});

els.clearCategoryButton.addEventListener("click", () => {
  els.categoryInput.value = "";
  if (categoryDropdown) categoryDropdown.render();
  els.categoryInput.dispatchEvent(new Event("change", { bubbles: true }));
});

els.subcategoryInput.addEventListener("change", updateClearSubcategoryButton);

els.clearSubcategoryButton.addEventListener("click", () => {
  els.subcategoryInput.value = "";
  if (subcategoryDropdown) subcategoryDropdown.render();
  els.subcategoryInput.dispatchEvent(new Event("change", { bubbles: true }));
});

function openRecipeDialog(mode, recipe) {
  ui.editingRecipeId = mode === "edit" ? recipe.id : null;
  els.recipeForm.reset();
  els.formError.textContent = "";
  els.fetchStatus.textContent = "";
  els.fetchStatus.className = "fetch-status";
  els.fetchButton.textContent = "Fetch recipe";
  els.deleteRecipeButton.classList.toggle("hidden", mode !== "edit");

  if (mode === "edit") {
    els.dialogEyebrow.textContent = "Recipe details";
    els.dialogTitle.textContent = "Edit recipe";
    els.formFields.disabled = false;
    els.urlInput.value = recipe.url;
    els.fetchButton.disabled = false;
    els.titleInput.value = recipe.title;
    els.sourceTypeInput.value = recipe.sourceType;
    if (sourceTypeDropdown) sourceTypeDropdown.render();
    populateCategorySelect(recipe.categoryId);
    populateSubcategorySelect(recipe.categoryId, recipe.subcategoryId);
    els.imageInput.value = recipe.image || "";
    els.tagInput.value = recipe.tag || "";
    els.notesInput.value = recipe.notes || "";
    els.favoriteInput.checked = !!recipe.favorite;
    els.wantToMakeInput.checked = !!recipe.wantToMake;
    els.madeInput.checked = !!recipe.made;
  } else {
    els.dialogEyebrow.textContent = "Recipe details";
    els.dialogTitle.textContent = "Add a recipe";
    els.formFields.disabled = true;
    els.urlInput.value = "";
    els.fetchButton.disabled = true;
    if (sourceTypeDropdown) sourceTypeDropdown.render();
    populateCategorySelect("");
    populateSubcategorySelect("", "");
  }

  els.recipeDialog.showModal();
  els.urlInput.focus();
}

function closeRecipeDialog() {
  els.recipeDialog.close();
}

els.urlInput.addEventListener("input", () => {
  els.fetchButton.disabled = els.urlInput.value.trim().length < 4;
});

function detectSourceType(urlString) {
  try {
    const host = new URL(urlString).hostname.replace("www.", "");
    if (host.includes("instagram")) return "Instagram Reel";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
    return "Website";
  } catch {
    return "Website";
  }
}

function placeholderRecipe(urlString) {
  const sourceType = detectSourceType(urlString);
  let hostLabel = "this link";
  try {
    hostLabel = new URL(urlString).hostname.replace("www.", "");
  } catch {
    // leave default
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: `Recipe from ${hostLabel}`,
        sourceType,
        image: "",
      });
    }, 500);
  });
}

async function readRealRecipe(urlString) {
  const endpoint = `${RECIPE_READER_ENDPOINT}?url=${encodeURIComponent(urlString)}`;
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(9000) });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    throw new Error((payload && payload.error) || "Couldn't read that page.");
  }
  return payload;
}

els.fetchButton.addEventListener("click", async () => {
  const url = els.urlInput.value.trim();
  if (!url) return;

  els.fetchButton.disabled = true;
  els.urlInput.disabled = true;
  els.fetchStatus.textContent = "Reading the page...";
  els.fetchStatus.className = "fetch-status is-loading";

  const sourceType = detectSourceType(url);
  let notes = null;

  try {
    let result;

    if (sourceType === "Website") {
      try {
        const real = await readRealRecipe(url);
        result = {
          title: real.title || `Recipe from ${real.host || "this link"}`,
          sourceType: "Website",
          image: real.image || "",
        };
        if (real.isRecipeSchema) {
          els.fetchStatus.textContent = "Found the recipe details on the page!";
        } else if (real.image) {
          els.fetchStatus.textContent = "Found a title and photo on the page.";
        } else {
          els.fetchStatus.textContent = "Found a title on the page — no photo detected.";
        }
        els.fetchStatus.className = "fetch-status is-success";
      } catch {
        result = await placeholderRecipe(url);
        els.fetchStatus.textContent = "Couldn't read that page automatically. Try again, or fill in the details yourself below.";
        els.fetchStatus.className = "fetch-status is-error";
      }
    } else if (sourceType === "TikTok") {
      try {
        const real = await readRealRecipe(url);
        result = {
          title: real.title || `TikTok video from ${real.host || "this link"}`,
          sourceType: "TikTok",
          image: real.image || "",
        };
        notes = real.description || null;
        els.fetchStatus.textContent = real.image
          ? "Found the caption and photo!"
          : "Found the caption — no photo detected.";
        els.fetchStatus.className = "fetch-status is-success";
      } catch {
        result = await placeholderRecipe(url);
        els.fetchStatus.textContent = "Couldn't read that video automatically. Try again, or fill in the details yourself below.";
        els.fetchStatus.className = "fetch-status is-error";
      }
    } else if (sourceType === "YouTube") {
      try {
        const real = await readRealRecipe(url);
        result = {
          title: real.title || `YouTube video from ${real.host || "this link"}`,
          sourceType: "YouTube",
          image: real.image || "",
        };
        els.fetchStatus.textContent = real.image
          ? "Found the title and thumbnail!"
          : "Found the title — no thumbnail detected.";
        els.fetchStatus.className = "fetch-status is-success";
      } catch {
        result = await placeholderRecipe(url);
        els.fetchStatus.textContent = "Couldn't read that video automatically. Try again, or fill in the details yourself below.";
        els.fetchStatus.className = "fetch-status is-error";
      }
    } else {
      result = await placeholderRecipe(url);
      els.fetchStatus.textContent =
        "Instagram Reels can't be auto-read yet — add a title and photo yourself below.";
      els.fetchStatus.className = "fetch-status is-success";
    }

    els.titleInput.value = result.title;
    els.sourceTypeInput.value = result.sourceType;
    if (sourceTypeDropdown) sourceTypeDropdown.render();
    els.imageInput.value = result.image;
    if (notes) els.notesInput.value = notes;
    els.formFields.disabled = false;
  } catch {
    els.fetchStatus.textContent = "Couldn't read that link. Try again or enter details manually.";
    els.fetchStatus.className = "fetch-status is-error";
  } finally {
    els.fetchButton.disabled = false;
    els.urlInput.disabled = false;
    els.fetchButton.textContent = "Re-fetch";
  }
});

els.manualEntryLink.addEventListener("click", () => {
  els.formFields.disabled = false;
  els.fetchStatus.textContent = "";
  els.fetchStatus.className = "fetch-status";
  els.titleInput.focus();
});

els.recipeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = els.titleInput.value.trim();
  const url = els.urlInput.value.trim();

  if (!title || !url) {
    els.formError.textContent = "A title and link are required.";
    return;
  }

  const payload = {
    title,
    url,
    sourceType: els.sourceTypeInput.value,
    categoryId: els.categoryInput.value,
    subcategoryId: els.subcategoryInput.value,
    image: els.imageInput.value.trim(),
    tag: els.tagInput.value.trim(),
    notes: els.notesInput.value.trim(),
    favorite: els.favoriteInput.checked,
    wantToMake: els.wantToMakeInput.checked,
    made: els.madeInput.checked,
  };

  els.saveRecipeButton?.setAttribute("disabled", "true");
  const ok = ui.editingRecipeId
    ? await updateRecipe(ui.editingRecipeId, payload)
    : await createRecipe(payload);
  els.saveRecipeButton?.removeAttribute("disabled");

  if (!ok) return;

  closeRecipeDialog();
  renderAll();
});

els.deleteRecipeButton.addEventListener("click", async () => {
  if (!ui.editingRecipeId) return;
  const recipe = state.recipes.find((r) => r.id === ui.editingRecipeId);
  const message = recipe
    ? `Delete "${recipe.title}"? This can't be undone.`
    : "Delete this recipe? This can't be undone.";
  if (!(await showConfirmDialog(message))) return;
  await removeRecipe(ui.editingRecipeId);
  closeRecipeDialog();
  renderAll();
});

els.closeDialogButton.addEventListener("click", closeRecipeDialog);
els.cancelDialogButton.addEventListener("click", closeRecipeDialog);
els.addRecipeButton.addEventListener("click", () => openRecipeDialog("add"));
els.emptyStateAddButton.addEventListener("click", () => openRecipeDialog("add"));

// ---------- topbar controls ----------

els.navAll.addEventListener("click", () => selectScope({ type: "all" }));
els.navFavorites.addEventListener("click", () => selectScope({ type: "favorites" }));
els.navWantToMake.addEventListener("click", () => selectScope({ type: "wantToMake" }));
els.navMade.addEventListener("click", () => selectScope({ type: "made" }));

els.searchInput.addEventListener("input", () => {
  ui.search = els.searchInput.value;
  renderGrid();
});

els.sourceFilter.addEventListener("change", () => {
  ui.source = els.sourceFilter.value;
  renderGrid();
});

els.sortSelect.addEventListener("change", () => {
  ui.sort = els.sortSelect.value;
  renderGrid();
});

// ---------- mobile sidebar ----------

function openSidebar() {
  els.sidebar.classList.add("is-open");
  els.sidebarOverlay.classList.add("is-visible");
  els.sidebarToggle.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  els.sidebar.classList.remove("is-open");
  els.sidebarOverlay.classList.remove("is-visible");
  els.sidebarToggle.setAttribute("aria-expanded", "false");
}

els.sidebarToggle.addEventListener("click", () => {
  els.sidebar.classList.contains("is-open") ? closeSidebar() : openSidebar();
});
els.sidebarOverlay.addEventListener("click", closeSidebar);

// ---------- custom dropdowns ----------

const dropdownClosers = [];

function closeAllDropdowns() {
  dropdownClosers.forEach((close) => close());
}

document.addEventListener("click", closeAllDropdowns);

function setupDropdown({ selectEl, wrapperEl, extraItemLabel, onExtraItem, placeholder }) {
  const trigger = wrapperEl.querySelector(".dropdown-trigger");
  const label = wrapperEl.querySelector(".dropdown-trigger-label");
  const menu = wrapperEl.querySelector(".dropdown-menu");

  function close() {
    menu.classList.add("hidden");
    wrapperEl.classList.remove("is-open");
  }

  function render() {
    const options = Array.from(selectEl.options);
    const selected = options.find((opt) => opt.value === selectEl.value);
    label.textContent = selected ? selected.textContent : placeholder || "";
    menu.innerHTML = "";

    options.forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "dropdown-option" + (opt.value === selectEl.value ? " is-selected" : "");
      item.textContent = opt.textContent;
      item.addEventListener("click", () => {
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        render();
        close();
      });
      menu.appendChild(item);
    });

    const resolvedExtraLabel = typeof extraItemLabel === "function" ? extraItemLabel() : extraItemLabel;
    if (resolvedExtraLabel) {
      const divider = document.createElement("div");
      divider.className = "dropdown-divider";
      menu.appendChild(divider);

      const createItem = document.createElement("button");
      createItem.type = "button";
      createItem.className = "dropdown-option dropdown-option-create";
      createItem.textContent = resolvedExtraLabel;
      createItem.addEventListener("click", (e) => {
        e.stopPropagation();
        onExtraItem({ menu, render, close });
      });
      menu.appendChild(createItem);
    }
  }

  function open() {
    closeAllDropdowns();
    render();
    menu.classList.remove("hidden");
    wrapperEl.classList.add("is-open");
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu.classList.contains("hidden")) open();
    else close();
  });

  menu.addEventListener("click", (e) => e.stopPropagation());

  dropdownClosers.push(close);
  render();

  return { render, close };
}

sourceTypeDropdown = setupDropdown({
  selectEl: els.sourceTypeInput,
  wrapperEl: document.getElementById("sourceTypeDropdown"),
});

subcategoryDropdown = setupDropdown({
  selectEl: els.subcategoryInput,
  wrapperEl: document.getElementById("subcategoryDropdown"),
  placeholder: "No subcategory",
  extraItemLabel: "+ New subcategory",
  onExtraItem: ({ menu, render, close }) => {
    const categoryId = els.categoryInput.value;
    if (!categoryId) {
      const hint = document.createElement("div");
      hint.className = "dropdown-create-row dropdown-hint";
      hint.textContent = "Pick a category first";
      menu.appendChild(hint);
      hint.scrollIntoView({ block: "nearest" });
      setTimeout(() => render(), 1400);
      return;
    }

    const row = document.createElement("div");
    row.className = "dropdown-create-row";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-edit-input";
    input.placeholder = "New subcategory name";
    row.appendChild(input);
    menu.appendChild(row);
    row.scrollIntoView({ block: "nearest" });
    input.focus();

    let settled = false;
    const commit = async () => {
      if (settled) return;
      settled = true;
      const value = input.value.trim();
      if (value) {
        const created = await createSubcategory(categoryId, value);
        if (created) {
          populateSubcategorySelect(categoryId, created.id);
        } else {
          render();
        }
      } else {
        render();
      }
      close();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        settled = true;
        render();
        close();
      }
    });
    input.addEventListener("blur", commit);
  },
});

sourceFilterDropdown = setupDropdown({
  selectEl: els.sourceFilter,
  wrapperEl: document.getElementById("sourceFilterDropdown"),
});

sortDropdown = setupDropdown({
  selectEl: els.sortSelect,
  wrapperEl: document.getElementById("sortDropdown"),
});

categoryDropdown = setupDropdown({
  selectEl: els.categoryInput,
  wrapperEl: document.getElementById("categoryDropdown"),
  placeholder: "Uncategorized",
  extraItemLabel: "+ New category",
  onExtraItem: ({ menu, render, close }) => {
    const row = document.createElement("div");
    row.className = "dropdown-create-row";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-edit-input";
    input.placeholder = "New category name";
    row.appendChild(input);
    menu.appendChild(row);
    row.scrollIntoView({ block: "nearest" });
    input.focus();

    let settled = false;
    const commit = async () => {
      if (settled) return;
      settled = true;
      const value = input.value.trim();
      if (value) {
        const created = await createCategory(value);
        if (created) {
          populateCategorySelect(created.id);
          populateSubcategorySelect(created.id, "");
        } else {
          render();
        }
      } else {
        render();
      }
      close();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        settled = true;
        render();
        close();
      }
    });
    input.addEventListener("blur", commit);
  },
});
