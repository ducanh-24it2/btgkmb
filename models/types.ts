export type Language = 'en' | 'vi';

export interface DishCategory {
  BIT230216_Id: string;
  BIT230216_Name: string;
  BIT230216_Description: string;
  BIT230216_RemoteId?: string | null;
}

export interface DishImage {
  BIT230216_Id: string;
  BIT230216_DishId: string;
  BIT230216_ImageUrl: string;
  BIT230216_IsThumbnail: boolean;
}

export interface Dish {
  BIT230216_Id: string;
  BIT230216_Name: string;
  BIT230216_Price: number;
  BIT230216_PreparationTime: number;
  BIT230216_IsAvailable: boolean;
  BIT230216_Description: string;
  BIT230216_DishCategoryId: string;
  BIT230216_Images: DishImage[];
  BIT230216_RemoteId?: string | null;
}

export interface DishDraft {
  BIT230216_Name: string;
  BIT230216_Price: number;
  BIT230216_PreparationTime: number;
  BIT230216_IsAvailable: boolean;
  BIT230216_Description: string;
  BIT230216_DishCategoryId: string;
  BIT230216_Images: Array<Pick<DishImage, 'BIT230216_ImageUrl' | 'BIT230216_IsThumbnail'>>;
}

export interface SyncQueueItem {
  BIT230216_Id: number;
  BIT230216_EntityType: 'Dish' | 'DishCategory';
  BIT230216_EntityId: string;
  BIT230216_Operation: 'UPSERT' | 'DELETE';
  BIT230216_Payload: string;
  BIT230216_CreatedAt: string;
}

export type AvailabilityFilter = 'all' | 'available' | 'unavailable';
export type DishSort = 'price-asc' | 'price-desc' | 'time-asc';