BEGIN;

INSERT INTO "blog" (
  "id",
  "name",
  "description",
  "website_url",
  "is_membership"
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'Travel Notes',
    'Stories and practical guides from trips around the world.',
    'https://example.com/travel',
    false
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Food Stories',
    'Recipes, restaurants, and culinary experiments.',
    'https://example.com/food',
    false
  )
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "website_url" = EXCLUDED."website_url",
  "is_membership" = EXCLUDED."is_membership",
  "updated_at" = now(),
  "deleted_at" = NULL;

INSERT INTO "post" (
  "id",
  "title",
  "short_description",
  "content",
  "blog_id"
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    'Sunrise in the Carpathians',
    'A quiet morning above the clouds.',
    'We started hiking before dawn and reached the ridge just as the first light appeared.',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Weekend in Lviv',
    'Architecture, coffee, and a long walk through the old town.',
    'This route covers the historic center, several courtyards, and a few favorite coffee shops.',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Coastline Road Trip',
    'Three days by the sea with a camera and a small backpack.',
    'The best stops were the quiet beaches away from the main road and the evening viewpoints.',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'Homemade Sourdough',
    'A simple loaf with a crisp crust.',
    'The dough fermented overnight and was baked in a preheated Dutch oven.',
    '10000000-0000-4000-8000-000000000002'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    'Summer Berry Tart',
    'A light dessert with seasonal berries.',
    'The tart combines a buttery base, vanilla cream, and fresh berries.',
    '10000000-0000-4000-8000-000000000002'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    'Pasta Night',
    'Fresh pasta with tomatoes, basil, and parmesan.',
    'A quick sauce works best when the tomatoes are ripe and the pasta is served immediately.',
    '10000000-0000-4000-8000-000000000002'
  )
ON CONFLICT ("id") DO UPDATE
SET
  "title" = EXCLUDED."title",
  "short_description" = EXCLUDED."short_description",
  "content" = EXCLUDED."content",
  "blog_id" = EXCLUDED."blog_id",
  "updated_at" = now(),
  "deleted_at" = NULL;

COMMIT;
