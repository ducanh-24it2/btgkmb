import * as SQLite from 'expo-sqlite';
import type { Dish, DishCategory, DishDraft, DishImage, Language, SyncQueueItem } from '../models/types';

const DATABASE_NAME = 'BIT230216_FoodManager.db';
const table = {
  category: 'BIT230216_DishCategory',
  dish: 'BIT230216_Dish',
  image: 'BIT230216_DishImage',
  queue: 'BIT230216_SyncQueue',
  settings: 'BIT230216_Settings',
} as const;

let database: SQLite.SQLiteDatabase | null = null;

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) throw new Error('Database has not been initialized.');
  return database;
}

async function enqueue(
  db: SQLite.SQLiteDatabase,
  entityType: 'Dish' | 'DishCategory',
  entityId: string,
  operation: 'UPSERT' | 'DELETE',
  payload: unknown,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO ${table.queue} (BIT230216_EntityType, BIT230216_EntityId, BIT230216_Operation, BIT230216_Payload, BIT230216_CreatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(BIT230216_EntityType, BIT230216_EntityId) DO UPDATE SET
       BIT230216_Operation = excluded.BIT230216_Operation,
       BIT230216_Payload = excluded.BIT230216_Payload,
      BIT230216_CreatedAt = excluded.BIT230216_CreatedAt`,
    entityType,
    entityId,
    operation,
    JSON.stringify(payload),
    `${new Date().toISOString()}_${Math.random().toString(36).slice(2, 8)}`,
  );
}

async function insertDishImages(db: SQLite.SQLiteDatabase, dishId: string, images: DishDraft['BIT230216_Images']): Promise<void> {
  await db.runAsync(`DELETE FROM ${table.image} WHERE BIT230216_DishId = ?`, dishId);
  for (const image of images) {
    await db.runAsync(
      `INSERT INTO ${table.image} (BIT230216_Id, BIT230216_DishId, BIT230216_ImageUrl, BIT230216_IsThumbnail)
       VALUES (?, ?, ?, ?)`,
      makeId('image'),
      dishId,
      image.BIT230216_ImageUrl,
      image.BIT230216_IsThumbnail ? 1 : 0,
    );
  }
}

async function enqueueDish(db: SQLite.SQLiteDatabase, dishId: string): Promise<void> {
  const dish = await getDishFrom(db, dishId);
  if (dish) await enqueue(db, 'Dish', dishId, 'UPSERT', dish);
}

async function getDishFrom(db: SQLite.SQLiteDatabase, dishId: string): Promise<Dish | null> {
  const row = await db.getFirstAsync<Omit<Dish, 'BIT230216_Images'>>(
    `SELECT BIT230216_Id, BIT230216_Name, BIT230216_Price, BIT230216_PreparationTime,
      BIT230216_IsAvailable, BIT230216_Description, BIT230216_DishCategoryId, BIT230216_RemoteId
     FROM ${table.dish} WHERE BIT230216_Id = ?`,
    dishId,
  );
  if (!row) return null;
  const images = await db.getAllAsync<DishImage>(
    `SELECT BIT230216_Id, BIT230216_DishId, BIT230216_ImageUrl, BIT230216_IsThumbnail
     FROM ${table.image} WHERE BIT230216_DishId = ? ORDER BY BIT230216_Id`,
    dishId,
  );
  return {
    ...row,
    BIT230216_IsAvailable: Boolean(row.BIT230216_IsAvailable),
    BIT230216_Images: images.map((image) => ({ ...image, BIT230216_IsThumbnail: Boolean(image.BIT230216_IsThumbnail) })),
  };
}

export async function initializeDatabase(): Promise<void> {
  database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync('PRAGMA foreign_keys = ON;');
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS ${table.category} (
      BIT230216_Id TEXT PRIMARY KEY NOT NULL,
      BIT230216_Name TEXT NOT NULL CHECK (length(trim(BIT230216_Name)) > 0),
      BIT230216_Description TEXT NOT NULL DEFAULT '',
      BIT230216_RemoteId TEXT
    );
    CREATE TABLE IF NOT EXISTS ${table.dish} (
      BIT230216_Id TEXT PRIMARY KEY NOT NULL,
      BIT230216_Name TEXT NOT NULL CHECK (length(trim(BIT230216_Name)) > 0),
      BIT230216_Price REAL NOT NULL CHECK (BIT230216_Price > 0),
      BIT230216_PreparationTime REAL NOT NULL CHECK (BIT230216_PreparationTime > 0),
      BIT230216_IsAvailable INTEGER NOT NULL DEFAULT 1,
      BIT230216_Description TEXT NOT NULL DEFAULT '',
      BIT230216_DishCategoryId TEXT NOT NULL REFERENCES ${table.category}(BIT230216_Id) ON DELETE RESTRICT,
      BIT230216_RemoteId TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS BIT230216_UQ_Dish_Name_Category
      ON ${table.dish}(BIT230216_DishCategoryId, BIT230216_Name COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS ${table.image} (
      BIT230216_Id TEXT PRIMARY KEY NOT NULL,
      BIT230216_DishId TEXT NOT NULL REFERENCES ${table.dish}(BIT230216_Id) ON DELETE CASCADE,
      BIT230216_ImageUrl TEXT NOT NULL,
      BIT230216_IsThumbnail INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS BIT230216_UQ_Dish_Thumbnail
      ON ${table.image}(BIT230216_DishId) WHERE BIT230216_IsThumbnail = 1;
    CREATE TABLE IF NOT EXISTS ${table.queue} (
      BIT230216_Id INTEGER PRIMARY KEY AUTOINCREMENT,
      BIT230216_EntityType TEXT NOT NULL,
      BIT230216_EntityId TEXT NOT NULL,
      BIT230216_Operation TEXT NOT NULL,
      BIT230216_Payload TEXT NOT NULL,
      BIT230216_CreatedAt TEXT NOT NULL,
      UNIQUE(BIT230216_EntityType, BIT230216_EntityId)
    );
    CREATE TABLE IF NOT EXISTS ${table.settings} (
      BIT230216_Key TEXT PRIMARY KEY NOT NULL,
      BIT230216_Value TEXT NOT NULL
    );
  `);

  const categoryCount = await database.getFirstAsync<{ BIT230216_Count: number }>(
    `SELECT COUNT(*) AS BIT230216_Count FROM ${table.category}`,
  );
  if ((categoryCount?.BIT230216_Count ?? 0) === 0) await seed(database);
}

async function seed(db: SQLite.SQLiteDatabase): Promise<void> {
  const categories: DishCategory[] = [
    { BIT230216_Id: 'category_main', BIT230216_Name: 'Main courses', BIT230216_Description: 'Hearty everyday meals' },
    { BIT230216_Id: 'category_salad', BIT230216_Name: 'Salads', BIT230216_Description: 'Fresh and seasonal' },
    { BIT230216_Id: 'category_dessert', BIT230216_Name: 'Desserts', BIT230216_Description: 'Sweet finishes' },
  ];
  const seeds = [
    ['dish_pasta', 'Creamy Mushroom Pasta', 12.5, 20, 1, 'Silky parmesan sauce with sautéed mushrooms.', 'category_main', 'photo-pasta', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80'],
    ['dish_pizza', 'Margherita Pizza', 14, 15, 1, 'Tomato, mozzarella, basil and a crisp crust.', 'category_main', 'photo-pizza', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=80'],
    ['dish_salad', 'Garden Bowl', 9.75, 12, 1, 'A bright mix of greens, avocado and citrus dressing.', 'category_salad', 'photo-salad', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=80'],
    ['dish_soup', 'Roasted Tomato Soup', 8.5, 35, 0, 'Slow-roasted tomatoes with herbs and cream.', 'category_main', 'photo-soup', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1000&q=80'],
    ['dish_pancakes', 'Berry Pancakes', 7.25, 18, 1, 'Fluffy pancakes topped with berries and maple syrup.', 'category_dessert', 'photo-pancakes', 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1000&q=80'],
  ] as const;

  await db.withTransactionAsync(async () => {
    for (const category of categories) {
      await db.runAsync(
        `INSERT INTO ${table.category} (BIT230216_Id, BIT230216_Name, BIT230216_Description) VALUES (?, ?, ?)`,
        category.BIT230216_Id,
        category.BIT230216_Name,
        category.BIT230216_Description,
      );
    }
    for (const [id, name, price, minutes, available, description, categoryId, imageId, imageUrl] of seeds) {
      await db.runAsync(
        `INSERT INTO ${table.dish} (BIT230216_Id, BIT230216_Name, BIT230216_Price, BIT230216_PreparationTime, BIT230216_IsAvailable, BIT230216_Description, BIT230216_DishCategoryId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        name,
        price,
        minutes,
        available,
        description,
        categoryId,
      );
      await db.runAsync(
        `INSERT INTO ${table.image} (BIT230216_Id, BIT230216_DishId, BIT230216_ImageUrl, BIT230216_IsThumbnail) VALUES (?, ?, ?, 1)`,
        imageId,
        id,
        imageUrl,
      );
    }
  });
}

export async function getCategories(): Promise<DishCategory[]> {
  const db = await getDatabase();
  return db.getAllAsync<DishCategory>(
    `SELECT BIT230216_Id, BIT230216_Name, BIT230216_Description, BIT230216_RemoteId FROM ${table.category} ORDER BY BIT230216_Name COLLATE NOCASE`,
  );
}

export async function getDishes(): Promise<Dish[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<Dish, 'BIT230216_Images'>>(
    `SELECT BIT230216_Id, BIT230216_Name, BIT230216_Price, BIT230216_PreparationTime,
      BIT230216_IsAvailable, BIT230216_Description, BIT230216_DishCategoryId, BIT230216_RemoteId
     FROM ${table.dish} ORDER BY BIT230216_Name COLLATE NOCASE`,
  );
  return Promise.all(rows.map(async (row) => {
    const images = await db.getAllAsync<DishImage>(
      `SELECT BIT230216_Id, BIT230216_DishId, BIT230216_ImageUrl, BIT230216_IsThumbnail
       FROM ${table.image} WHERE BIT230216_DishId = ? ORDER BY BIT230216_Id`,
      row.BIT230216_Id,
    );
    return {
      ...row,
      BIT230216_IsAvailable: Boolean(row.BIT230216_IsAvailable),
      BIT230216_Images: images.map((image) => ({ ...image, BIT230216_IsThumbnail: Boolean(image.BIT230216_IsThumbnail) })),
    };
  }));
}

export async function getDishById(id: string): Promise<Dish | null> {
  return getDishFrom(await getDatabase(), id);
}

export async function saveDish(draft: DishDraft, id?: string): Promise<string> {
  const db = await getDatabase();
  const dishId = id ?? makeId('dish');
  await db.withTransactionAsync(async () => {
    if (id) {
      await db.runAsync(
        `UPDATE ${table.dish} SET BIT230216_Name = ?, BIT230216_Price = ?, BIT230216_PreparationTime = ?,
          BIT230216_IsAvailable = ?, BIT230216_Description = ?, BIT230216_DishCategoryId = ? WHERE BIT230216_Id = ?`,
        draft.BIT230216_Name.trim(),
        draft.BIT230216_Price,
        draft.BIT230216_PreparationTime,
        draft.BIT230216_IsAvailable ? 1 : 0,
        draft.BIT230216_Description.trim(),
        draft.BIT230216_DishCategoryId,
        dishId,
      );
    } else {
      await db.runAsync(
        `INSERT INTO ${table.dish} (BIT230216_Id, BIT230216_Name, BIT230216_Price, BIT230216_PreparationTime, BIT230216_IsAvailable, BIT230216_Description, BIT230216_DishCategoryId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        dishId,
        draft.BIT230216_Name.trim(),
        draft.BIT230216_Price,
        draft.BIT230216_PreparationTime,
        draft.BIT230216_IsAvailable ? 1 : 0,
        draft.BIT230216_Description.trim(),
        draft.BIT230216_DishCategoryId,
      );
    }
    await insertDishImages(db, dishId, draft.BIT230216_Images);
    await enqueueDish(db, dishId);
  });
  return dishId;
}

export async function deleteDish(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<{ BIT230216_RemoteId: string | null }>(
      `SELECT BIT230216_RemoteId FROM ${table.dish} WHERE BIT230216_Id = ?`, id,
    );
    if (!row) return;
    if (row.BIT230216_RemoteId) await enqueue(db, 'Dish', id, 'DELETE', { BIT230216_Id: id });
    else await db.runAsync(`DELETE FROM ${table.queue} WHERE BIT230216_EntityType = 'Dish' AND BIT230216_EntityId = ?`, id);
    await db.runAsync(`DELETE FROM ${table.dish} WHERE BIT230216_Id = ?`, id);
  });
}

export async function setThumbnail(dishId: string, imageId: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE ${table.image} SET BIT230216_IsThumbnail = 0 WHERE BIT230216_DishId = ?`, dishId);
    await db.runAsync(
      `UPDATE ${table.image} SET BIT230216_IsThumbnail = 1 WHERE BIT230216_DishId = ? AND BIT230216_Id = ?`,
      dishId,
      imageId,
    );
    await enqueueDish(db, dishId);
  });
}

export async function createCategory(name: string): Promise<void> {
  const db = await getDatabase();
  const category: DishCategory = { BIT230216_Id: makeId('category'), BIT230216_Name: name.trim(), BIT230216_Description: '' };
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO ${table.category} (BIT230216_Id, BIT230216_Name, BIT230216_Description) VALUES (?, ?, '')`,
      category.BIT230216_Id,
      category.BIT230216_Name,
    );
    await enqueue(db, 'DishCategory', category.BIT230216_Id, 'UPSERT', category);
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    const count = await db.getFirstAsync<{ BIT230216_Count: number }>(
      `SELECT COUNT(*) AS BIT230216_Count FROM ${table.dish} WHERE BIT230216_DishCategoryId = ?`, id,
    );
    if ((count?.BIT230216_Count ?? 0) > 0) throw new Error('CATEGORY_IN_USE');
    const category = await db.getFirstAsync<DishCategory>(
      `SELECT BIT230216_Id, BIT230216_Name, BIT230216_Description, BIT230216_RemoteId FROM ${table.category} WHERE BIT230216_Id = ?`, id,
    );
    if (!category) return;
    if (category.BIT230216_RemoteId) await enqueue(db, 'DishCategory', id, 'DELETE', { BIT230216_Id: id });
    else await db.runAsync(`DELETE FROM ${table.queue} WHERE BIT230216_EntityType = 'DishCategory' AND BIT230216_EntityId = ?`, id);
    await db.runAsync(`DELETE FROM ${table.category} WHERE BIT230216_Id = ?`, id);
  });
}

export async function getSavedLanguage(): Promise<Language> {
  const db = await getDatabase();
  const setting = await db.getFirstAsync<{ BIT230216_Value: string }>(
    `SELECT BIT230216_Value FROM ${table.settings} WHERE BIT230216_Key = 'language'`,
  );
  return setting?.BIT230216_Value === 'vi' ? 'vi' : 'en';
}

export async function saveLanguage(language: Language): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO ${table.settings} (BIT230216_Key, BIT230216_Value) VALUES ('language', ?)
     ON CONFLICT(BIT230216_Key) DO UPDATE SET BIT230216_Value = excluded.BIT230216_Value`,
    language,
  );
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<SyncQueueItem>(`SELECT * FROM ${table.queue} ORDER BY BIT230216_Id`);
}

export async function getRemoteId(entityType: 'Dish' | 'DishCategory', entityId: string): Promise<string | null> {
  const db = await getDatabase();
  const targetTable = entityType === 'Dish' ? table.dish : table.category;
  const row = await db.getFirstAsync<{ BIT230216_RemoteId: string | null }>(
    `SELECT BIT230216_RemoteId FROM ${targetTable} WHERE BIT230216_Id = ?`, entityId,
  );
  return row?.BIT230216_RemoteId ?? null;
}

export async function markSynced(item: SyncQueueItem, remoteId: string): Promise<void> {
  const db = await getDatabase();
  const targetTable = item.BIT230216_EntityType === 'Dish' ? table.dish : table.category;
  await db.withTransactionAsync(async () => {
    const pending = await db.getFirstAsync<{ BIT230216_CreatedAt: string }>(
      `SELECT BIT230216_CreatedAt FROM ${table.queue} WHERE BIT230216_Id = ?`, item.BIT230216_Id,
    );
    if (item.BIT230216_Operation === 'UPSERT') {
      await db.runAsync(`UPDATE ${targetTable} SET BIT230216_RemoteId = ? WHERE BIT230216_Id = ?`, remoteId, item.BIT230216_EntityId);
    }
    // Preserve a newer local edit, or queue a delete if the local record vanished during an in-flight create.
    if (!pending) {
      const entity = await db.getFirstAsync<{ BIT230216_Id: string }>(
        `SELECT BIT230216_Id FROM ${targetTable} WHERE BIT230216_Id = ?`, item.BIT230216_EntityId,
      );
      if (!entity && item.BIT230216_Operation === 'UPSERT') {
        await enqueue(db, item.BIT230216_EntityType, item.BIT230216_EntityId, 'DELETE', {
          BIT230216_Id: item.BIT230216_EntityId,
          BIT230216_RemoteId: remoteId,
        });
      }
    } else if (pending.BIT230216_CreatedAt === item.BIT230216_CreatedAt) {
      await db.runAsync(`DELETE FROM ${table.queue} WHERE BIT230216_Id = ?`, item.BIT230216_Id);
    }
  });
}

export async function acknowledgeDelete(item: SyncQueueItem): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM ${table.queue} WHERE BIT230216_Id = ? AND BIT230216_CreatedAt = ?`,
    item.BIT230216_Id,
    item.BIT230216_CreatedAt,
  );
}

export async function getPendingSyncCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ BIT230216_Count: number }>(
    `SELECT COUNT(*) AS BIT230216_Count FROM ${table.queue}`,
  );
  return result?.BIT230216_Count ?? 0;
}