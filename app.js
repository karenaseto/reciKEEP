import { buildSeedData, PLACEHOLDER_IMAGES } from "./data.js?v=2";

const STORAGE_KEY = "recikeep:v2";
const RECIPE_READER_ENDPOINT = "http://localhost:8787/api/parse-recipe";

const els = {
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  navAll: document.getElementById("navAll"),
  navFavorites: document.getElementById("navFavorites"),
  countAll: document.getElementById("countAll"),
  countFavorites: document.getElementById("countFavorites"),
  categoryTree: document.getElementById("categoryTree"),
  addCategoryButton: document.getElementById("addCategoryButton"),

  scopeEyebrow: document.getElementById("scopeEyebrow"),
  scopeTitle: document.getElementById("scopeTitle"),
  searchInput: document.getElementById("searchInput"),
  sourceFilter: document.getElementById("sourceFilter"),
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
  subcategoryInput: document.getElementById("subcategoryInput"),
  imageInput: document.getElementById("imageInput"),
  tagInput: document.getElementById("tagInput"),
  notesInput: document.getElementById("notesInput"),
  favoriteInput: document.getElementById("favoriteInput"),
  formError: document.getElementById("formError"),
  deleteRecipeButton: document.getElementById("deleteRecipeButton"),
  cancelDialogButton: document.getElementById("cancelDialogButton"),
  recipeCardTemplate: document.getElementById("recipeCardTemplate"),
};

let state = loadState();

const ui = {
  scope: { type: "all" },
  search: "",
  source: "all",
  expanded: new Set(),
  editingRecipeId: null,
};

function uid() {
  return crypto.randomUUID();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.recipes)) {
        return {
          categories: parsed.categories,
          subcategories: parsed.subcategories || [],
          recipes: parsed.recipes,
        };
      }
    }
  } catch (err) {
    console.warn("Could not read saved data, starting fresh.", err);
  }
  const seed = buildSeedData();
  persist(seed);
  return seed;
}

function persist(next = state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      categories: next.categories,
      subcategories: next.subcategories,
      recipes: next.recipes,
    })
  );
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

  els.navAll.classList.toggle("active", ui.scope.type === "all");
  els.navFavorites.classList.toggle("active", ui.scope.type === "favorites");

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

  const chevron = document.createElement("button");
  chevron.type = "button";
  chevron.className = "chevron-btn" + (subs.length ? "" : " chevron-empty");
  chevron.setAttribute("aria-label", isExpanded ? "Collapse" : "Expand");
  chevron.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m9 6 6 6-6 6"/></svg>';
  if (isExpanded) chevron.classList.add("is-expanded");
  chevron.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!subs.length) return;
    if (ui.expanded.has(category.id)) ui.expanded.delete(category.id);
    else ui.expanded.add(category.id);
    renderSidebar();
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
  main.append(chevron, nameSpan, countSpan, actions);
  main.addEventListener("click", () => selectScope({ type: "category", id: category.id }));

  wrap.appendChild(main);

  if (subs.length && isExpanded) {
    const list = document.createElement("div");
    list.className = "subcategory-list";
    subs.forEach((sub) => list.appendChild(buildSubcategoryRow(sub)));
    wrap.appendChild(list);
  }

  return wrap;
}

function buildSubcategoryRow(sub) {
  const row = document.createElement("div");
  row.className = "subcategory-row";
  if (ui.scope.type === "subcategory" && ui.scope.id === sub.id) {
    row.classList.add("active");
  }

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
  row.append(nameSpan, countSpan, actions);
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
      category.name = value;
      persist();
    }
    renderSidebar();
    renderTopbar();
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
      sub.name = value;
      persist();
    }
    renderSidebar();
    renderTopbar();
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
      state.subcategories.push({
        id: uid(),
        name: value,
        categoryId,
        createdAt: new Date().toISOString(),
      });
      persist();
    }
    renderSidebar();
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
      state.categories.push({ id: uid(), name: value, createdAt: new Date().toISOString() });
      persist();
    }
    renderSidebar();
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

function deleteCategory(category) {
  const subs = subcategoriesFor(category.id);
  const affected = state.recipes.filter((r) => r.categoryId === category.id).length;
  const warning =
    affected || subs.length
      ? `"${category.name}" has ${affected} recipe(s) and ${subs.length} subcategory(ies). Deleting it will move those recipes to Uncategorized. Continue?`
      : `Delete "${category.name}"?`;
  if (!window.confirm(warning)) return;

  const subIds = new Set(subs.map((s) => s.id));
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

  persist();
  renderAll();
}

function deleteSubcategory(sub) {
  const affected = recipeCountForSubcategory(sub.id);
  const warning = affected
    ? `"${sub.name}" has ${affected} recipe(s). Deleting it will keep those recipes in the main category, just without this subcategory. Continue?`
    : `Delete "${sub.name}"?`;
  if (!window.confirm(warning)) return;

  state.recipes.forEach((r) => {
    if (r.subcategoryId === sub.id) r.subcategoryId = "";
  });
  state.subcategories = state.subcategories.filter((s) => s.id !== sub.id);

  if (ui.scope.type === "subcategory" && ui.scope.id === sub.id) ui.scope = { type: "all" };

  persist();
  renderAll();
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
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((recipe) => els.recipesGrid.appendChild(buildRecipeCard(recipe)));
}

function buildRecipeCard(recipe) {
  const node = els.recipeCardTemplate.content.firstElementChild.cloneNode(true);

  const img = node.querySelector(".card-image");
  img.src = recipe.image || fallbackImage(recipe.sourceType);
  img.alt = recipe.title;

  const favBtn = node.querySelector(".favorite-chip");
  favBtn.classList.toggle("is-favorite", !!recipe.favorite);
  favBtn.addEventListener("click", () => {
    recipe.favorite = !recipe.favorite;
    persist();
    renderSidebar();
    renderGrid();
  });

  const category = getCategory(recipe.categoryId);
  const subcategory = getSubcategory(recipe.subcategoryId);

  node.querySelector(".card-category").textContent = category ? category.name : "Uncategorized";
  node.querySelector(".card-source").textContent = recipe.sourceType;
  node.querySelector(".card-title").textContent = recipe.title;
  node.querySelector(".card-notes").textContent = recipe.notes || "";

  const subEl = node.querySelector(".card-subcategory");
  if (subcategory) {
    subEl.textContent = subcategory.name;
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
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "Uncategorized";
  els.categoryInput.appendChild(noneOpt);

  state.categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    els.categoryInput.appendChild(opt);
  });
  els.categoryInput.value = selectedCategoryId || "";
}

function populateSubcategorySelect(categoryId, selectedSubcategoryId) {
  els.subcategoryInput.innerHTML = "";
  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "No subcategory";
  els.subcategoryInput.appendChild(noneOpt);

  subcategoriesFor(categoryId).forEach((sub) => {
    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = sub.name;
    els.subcategoryInput.appendChild(opt);
  });
  els.subcategoryInput.value = selectedSubcategoryId || "";
}

els.categoryInput.addEventListener("change", () => {
  populateSubcategorySelect(els.categoryInput.value, "");
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
    populateCategorySelect(recipe.categoryId);
    populateSubcategorySelect(recipe.categoryId, recipe.subcategoryId);
    els.imageInput.value = recipe.image || "";
    els.tagInput.value = recipe.tag || "";
    els.notesInput.value = recipe.notes || "";
    els.favoriteInput.checked = !!recipe.favorite;
  } else {
    els.dialogEyebrow.textContent = "Recipe details";
    els.dialogTitle.textContent = "Add a recipe";
    els.formFields.disabled = true;
    els.urlInput.value = "";
    els.fetchButton.disabled = true;
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
  const bucket = PLACEHOLDER_IMAGES[sourceType] || PLACEHOLDER_IMAGES.Website;
  const image = bucket[Math.floor(Math.random() * bucket.length)];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: `Recipe from ${hostLabel}`,
        sourceType,
        image,
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

  try {
    let result;

    if (sourceType === "Website") {
      try {
        const real = await readRealRecipe(url);
        result = {
          title: real.title || `Recipe from ${real.host || "this link"}`,
          sourceType: "Website",
          image: real.image || fallbackImage("Website"),
        };
        els.fetchStatus.textContent = real.isRecipeSchema
          ? "Found the recipe details on the page!"
          : "Found a title and photo on the page.";
        els.fetchStatus.className = "fetch-status is-success";
      } catch {
        result = await placeholderRecipe(url);
        els.fetchStatus.textContent =
          "Couldn't read that page automatically — filled in a placeholder instead. (Is the reader server running?)";
        els.fetchStatus.className = "fetch-status is-error";
      }
    } else {
      result = await placeholderRecipe(url);
      els.fetchStatus.textContent =
        "Reels and videos can't be auto-read yet — using a placeholder photo.";
      els.fetchStatus.className = "fetch-status is-success";
    }

    els.titleInput.value = result.title;
    els.sourceTypeInput.value = result.sourceType;
    els.imageInput.value = result.image;
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

els.recipeForm.addEventListener("submit", (e) => {
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
  };

  if (ui.editingRecipeId) {
    const recipe = state.recipes.find((r) => r.id === ui.editingRecipeId);
    Object.assign(recipe, payload);
  } else {
    state.recipes.push({
      id: uid(),
      createdAt: new Date().toISOString(),
      ...payload,
    });
  }

  persist();
  closeRecipeDialog();
  renderAll();
});

els.deleteRecipeButton.addEventListener("click", () => {
  if (!ui.editingRecipeId) return;
  if (!window.confirm("Delete this recipe?")) return;
  state.recipes = state.recipes.filter((r) => r.id !== ui.editingRecipeId);
  persist();
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

els.searchInput.addEventListener("input", () => {
  ui.search = els.searchInput.value;
  renderGrid();
});

els.sourceFilter.addEventListener("change", () => {
  ui.source = els.sourceFilter.value;
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

// ---------- init ----------

renderAll();
