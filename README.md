# btgkmb

## BIT230216_FoodManager

Ứng dụng quản lý món ăn offline-first bằng React Native, Expo, TypeScript và SQLite.

**Sinh viên:** Trần Đăng Khôi  
**MSSV:** BIT230216

## Chạy ứng dụng

Cần cài Node.js LTS và npm. Từ thư mục project:

```powershell
npm install
npx expo start
```

Mở ứng dụng bằng Expo Go trên Android/iOS hoặc chọn emulator trong Expo CLI. Kiểm tra kiểu dữ liệu bằng:

```powershell
npm run typecheck
```

Ứng dụng tạo SQLite database và tự khởi tạo 3 loại món, 5 món mẫu cùng ảnh mẫu ở lần chạy đầu tiên. Dữ liệu và lựa chọn ngôn ngữ được giữ trên thiết bị.

## MockAPI đồng bộ

Tạo hai resource trong MockAPI: `BIT230216_Dish` và `BIT230216_DishCategory`. Các field dữ liệu gửi lên API đều dùng tiền tố `BIT230216_`; `id` do MockAPI cấp là metadata của nền tảng. Món ăn được gửi cùng danh sách `BIT230216_Images`.

Sao chép `.env.example` thành `.env`, rồi điền URL gốc API (không thêm tên resource):

```dotenv
EXPO_PUBLIC_MOCKAPI_BASE_URL=https://<project-id>.mockapi.io/api/v1
EXPO_PUBLIC_MOCKAPI_DISH_RESOURCE=BIT230216_Dish
EXPO_PUBLIC_MOCKAPI_CATEGORY_RESOURCE=BIT230216_DishCategory
```

Khởi động lại Expo sau khi thay đổi biến môi trường. Ứng dụng lưu thay đổi vào SQLite trước, đưa thao tác cần gửi vào `BIT230216_SyncQueue`, rồi tự gửi khi kết nối có Internet hoặc khi app trở lại foreground. ID local ổn định `BIT230216_Id` được dùng để tìm bản ghi hiện có trước khi tạo mới, tránh tạo bản sao khi retry. Nếu request lỗi, hàng đợi được giữ lại để thử ở lần có kết nối tiếp theo. Dữ liệu mẫu chỉ được khởi tạo local; các thay đổi mới được đưa vào hàng đợi đồng bộ.

Không đặt token hoặc thông tin bí mật trong biến `EXPO_PUBLIC_*`, vì các giá trị này được đóng gói vào ứng dụng client.

## Tổ chức mã nguồn

- `components/`: điều khiển dùng chung và thẻ món ăn.
- `screens/`: danh sách, chi tiết, form món ăn và quản lý loại món.
- `database/`: schema SQLite, dữ liệu mẫu, repository CRUD và hàng đợi đồng bộ.
- `models/`: model TypeScript có tên field theo quy tắc tiền tố.
- `localization/`: chuỗi English / Tiếng Việt.
- `services/`: kết nối và tự đồng bộ MockAPI.

Tất cả bảng và cột SQLite, cùng field dữ liệu trao đổi với API, phải bắt đầu bằng `BIT230216_`.