import type { Language } from '../models/types';

const messages = {
  en: {
    appName: 'Food Manager', dishes: 'Dishes', categories: 'Categories', search: 'Search dishes',
    allCategories: 'All categories', availableOnly: 'Available only', allStatuses: 'All statuses',
    available: 'Available', unavailable: 'Unavailable', minPrice: 'Min price', maxPrice: 'Max price',
    sort: 'Sort', priceAsc: 'Price: low to high', priceDesc: 'Price: high to low', timeAsc: 'Prep: shortest first',
    resetFilters: 'Reset', noDishes: 'No dishes match these filters.', addDish: 'Add dish', details: 'Details',
    edit: 'Edit', delete: 'Delete', cancel: 'Cancel', save: 'Save changes', create: 'Create dish',
    name: 'Name', price: 'Price', prepTime: 'Preparation time (min)', description: 'Description',
    category: 'Category', images: 'Images', imageUrls: 'Image URLs, one per line', imageHint: 'Use a public image URL.',
    thumbnail: 'Thumbnail', setThumbnail: 'Set as thumbnail', quick: 'Quick', regular: 'Regular',
    back: 'Back', confirmDelete: 'Confirm deletion', deleteDishPrompt: 'Delete this dish permanently?',
    manageCategories: 'Manage categories', categoryName: 'Category name', addCategory: 'Add category',
    emptyCategories: 'No categories yet.', nameRequired: 'Enter a name.', priceInvalid: 'Price must be greater than zero.',
    timeInvalid: 'Preparation time must be greater than zero.', categoryRequired: 'Choose a category.',
    invalidPriceRange: 'Minimum price cannot exceed maximum price.', duplicateDish: 'A dish with this name already exists in this category.',
    imageUrlInvalid: 'Each image must be a valid http or https URL.', notFound: 'This dish no longer exists.',
    saved: 'Changes saved.', error: 'Something went wrong. Please try again.', language: 'Language',
    english: 'English', vietnamese: 'Tiếng Việt', deleteCategoryPrompt: 'Delete this category?',
    categoryInUse: 'This category still contains dishes and cannot be deleted.', syncPending: 'Pending sync',
    syncFailed: 'Saved locally. Sync will retry when the connection is available.', syncConfigured: 'Connected to MockAPI',
    noInternet: 'Offline mode', loading: 'Loading your dishes…', retry: 'Retry', emptyImages: 'No images added.',
    close: 'Close', chooseCategory: 'Choose a category', dishesCount: 'dishes', syncUnavailable: 'MockAPI is not configured',
    catMain: 'Main courses', catSalad: 'Salads', catDessert: 'Desserts', categoryExists: 'A category with this name already exists.',
  },
  vi: {
    appName: 'Quản lý món ăn', dishes: 'Món ăn', categories: 'Loại món', search: 'Tìm món ăn',
    allCategories: 'Tất cả loại món', availableOnly: 'Chỉ đang bán', allStatuses: 'Tất cả trạng thái',
    available: 'Đang bán', unavailable: 'Ngừng bán', minPrice: 'Giá thấp nhất', maxPrice: 'Giá cao nhất',
    sort: 'Sắp xếp', priceAsc: 'Giá: thấp đến cao', priceDesc: 'Giá: cao đến thấp', timeAsc: 'Chế biến: nhanh nhất',
    resetFilters: 'Đặt lại', noDishes: 'Không có món ăn phù hợp bộ lọc.', addDish: 'Thêm món', details: 'Chi tiết',
    edit: 'Sửa', delete: 'Xóa', cancel: 'Hủy', save: 'Lưu thay đổi', create: 'Tạo món',
    name: 'Tên món', price: 'Giá', prepTime: 'Thời gian chế biến (phút)', description: 'Mô tả',
    category: 'Loại món', images: 'Hình ảnh', imageUrls: 'Đường dẫn ảnh, mỗi dòng một URL', imageHint: 'Dùng đường dẫn ảnh công khai.',
    thumbnail: 'Ảnh đại diện', setThumbnail: 'Đặt làm ảnh đại diện', quick: 'Nhanh', regular: 'Thông thường',
    back: 'Quay lại', confirmDelete: 'Xác nhận xóa', deleteDishPrompt: 'Xóa món ăn này vĩnh viễn?',
    manageCategories: 'Quản lý loại món', categoryName: 'Tên loại món', addCategory: 'Thêm loại món',
    emptyCategories: 'Chưa có loại món.', nameRequired: 'Vui lòng nhập tên.', priceInvalid: 'Giá phải lớn hơn 0.',
    timeInvalid: 'Thời gian chế biến phải lớn hơn 0.', categoryRequired: 'Vui lòng chọn loại món.',
    invalidPriceRange: 'Giá thấp nhất không được lớn hơn giá cao nhất.', duplicateDish: 'Tên món này đã có trong loại món đã chọn.',
    imageUrlInvalid: 'Mỗi ảnh phải là URL http hoặc https hợp lệ.', notFound: 'Món ăn này không còn tồn tại.',
    saved: 'Đã lưu thay đổi.', error: 'Đã xảy ra lỗi. Vui lòng thử lại.', language: 'Ngôn ngữ',
    english: 'English', vietnamese: 'Tiếng Việt', deleteCategoryPrompt: 'Xóa loại món này?',
    categoryInUse: 'Loại món vẫn còn món ăn nên không thể xóa.', syncPending: 'Đang chờ đồng bộ',
    syncFailed: 'Đã lưu trên thiết bị. Sẽ đồng bộ lại khi có kết nối.', syncConfigured: 'Đã kết nối MockAPI',
    noInternet: 'Chế độ ngoại tuyến', loading: 'Đang tải món ăn…', retry: 'Thử lại', emptyImages: 'Chưa có hình ảnh.',
    close: 'Đóng', chooseCategory: 'Chọn loại món', dishesCount: 'món', syncUnavailable: 'Chưa cấu hình MockAPI',
    catMain: 'Món chính', catSalad: 'Món trộn', catDessert: 'Tráng miệng', categoryExists: 'Loại món này đã tồn tại.',
  },
} as const;

export type TranslationKey = keyof typeof messages.en;

export function translate(language: Language, key: TranslationKey): string {
  return messages[language][key];
}