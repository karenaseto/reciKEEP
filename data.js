function uid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

export function buildSeedData() {
  const categories = ["Sweet Pastries", "Savory Pastries", "Drinks", "Appetizers", "Meals"].map(
    (name) => ({ id: uid(), name, createdAt: nowIso() })
  );
  const categoryIdByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  const subcategories = [
    { name: "Weekend Baking", parent: "Sweet Pastries" },
    { name: "Party Snacks", parent: "Appetizers" },
    { name: "Easy Weeknight", parent: "Meals" },
  ].map((s) => ({
    id: uid(),
    name: s.name,
    categoryId: categoryIdByName[s.parent],
    createdAt: nowIso(),
  }));
  const subcategoryIdByName = Object.fromEntries(subcategories.map((s) => [s.name, s.id]));

  const recipes = [
    {
      title: "Strawberry Cream Croissant Toast",
      url: "https://www.instagram.com/",
      sourceType: "Instagram Reel",
      category: "Sweet Pastries",
      subcategory: "Weekend Baking",
      image:
        "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=1200&q=80",
      tag: "Brunch",
      notes: "Cute idea for a weekend treat. I want to try it with puff pastry too.",
      favorite: true,
    },
    {
      title: "Tomato Pesto Puff Pastry Twists",
      url: "https://www.tiktok.com/",
      sourceType: "TikTok",
      category: "Savory Pastries",
      subcategory: "",
      image:
        "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=1200&q=80",
      tag: "Party",
      notes: "Good appetizer idea for potlucks or birthdays.",
      favorite: false,
    },
    {
      title: "Brown Sugar Matcha Latte",
      url: "https://www.youtube.com/",
      sourceType: "YouTube",
      category: "Drinks",
      subcategory: "",
      image:
        "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=1200&q=80",
      tag: "Cafe",
      notes: "Looks easy to make at home with oat milk.",
      favorite: false,
    },
    {
      title: "Whipped Ricotta Crostini",
      url: "https://example.com/recipe",
      sourceType: "Website",
      category: "Appetizers",
      subcategory: "Party Snacks",
      image:
        "https://images.unsplash.com/photo-1514944152559-a103040c7f16?auto=format&fit=crop&w=1200&q=80",
      tag: "Hosting",
      notes: "Could be good with hot honey and peaches.",
      favorite: true,
    },
    {
      title: "One-Pan Lemon Garlic Chicken",
      url: "https://example.com/dinner",
      sourceType: "Website",
      category: "Meals",
      subcategory: "Easy Weeknight",
      image:
        "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=1200&q=80",
      tag: "Weeknight",
      notes: "This is the kind of dinner recipe I always lose, so I want it saved here.",
      favorite: false,
    },
  ].map((r) => ({
    id: uid(),
    title: r.title,
    url: r.url,
    sourceType: r.sourceType,
    categoryId: categoryIdByName[r.category] || "",
    subcategoryId: subcategoryIdByName[r.subcategory] || "",
    image: r.image,
    tag: r.tag,
    notes: r.notes,
    favorite: r.favorite,
    createdAt: nowIso(),
  }));

  return { categories, subcategories, recipes };
}

export const SOURCE_TYPES = ["Instagram Reel", "TikTok", "Website", "YouTube"];

export const PLACEHOLDER_IMAGES = {
  "Instagram Reel": [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80",
  ],
  TikTok: [
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
  ],
  YouTube: [
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495195129352-aeb325a55b65?auto=format&fit=crop&w=1200&q=80",
  ],
  Website: [
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=80",
  ],
};
