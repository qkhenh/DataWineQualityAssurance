### PHẦN 1: CÀI ĐẶT MÔI TRƯỜNG & THƯ VIỆN

Giả định teammate của bạn đã cài **Node.js**, **Python** và **MySQL Server**.

#### Bước 1: Cài đặt Yarn (nếu chưa có)
Mở terminal (CMD/PowerShell/Bash) và chạy lệnh sau để cài yarn thông qua npm:
```bash
npm install -g yarn
```

#### Bước 2: Cài đặt thư viện cho Backend & Frontend
Hệ thống chia làm 3 phần chính, cần cài đặt riêng biệt.

**1. Backend (Node.js):**
```bash
cd backend
yarn install
# Hoặc nếu gặp lỗi thì dùng: npm install
```

**2. Frontend (React/Vite):**
```bash
cd ../frontend
yarn install
```

**3. AI Service (Python):**
Khuyên dùng môi trường ảo (virtual environment) để tránh xung đột.
```bash
cd ../ai_service
# Tạo môi trường ảo (Windows)
python -m venv venv
# Kích hoạt môi trường ảo
.\venv\Scripts\activate
# Cài đặt thư viện
pip install -r requirements.txt
```

---

### PHẦN 2: THIẾT LẬP CƠ SỞ DỮ LIỆU (DATABASE)

Đây là bước quan trọng nhất để hệ thống chạy được.

1.  **Tạo Database:**
    Mở MySQL Workbench hoặc công cụ quản lý DB, tạo một database mới tên là `wine_production`.

2.  **Import cấu trúc bảng:**
    Chạy file SQL nằm trong thư mục wine_db_structure.sql vào database `wine_production` vừa tạo.

3.  **Cập nhật cấu trúc mới nhất (Quan trọng):**
    Vì code mới có cập nhật thêm cột `warehouse_id` vào bảng `product`, hãy chạy lệnh sau để đảm bảo DB đồng bộ với code mới nhất:
    ```bash
    # Tại thư mục gốc dự án
    cd backend
    node scripts/migrate_db_v2.js
    node scripts/ensure_batch_index.js
    ```

4.  **Cấu hình kết nối (.env):**
    Trong thư mục backend, tạo một file tên là `.env` với nội dung sau (thay đổi user/pass cho đúng với máy của teammate):
    ```env
    PORT=5001
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password_here
    DB_NAME=wine_production
    ACCESS_TOKEN_SECRET=secret_key_random_string
    CLIENT_URL=http://localhost:5173
    AI_SERVICE_URL=http://127.0.0.1:8000
    ```

---

### PHẦN 3: KHỞI CHẠY HỆ THỐNG

Cần mở **3 Terminal** riêng biệt để chạy 3 dịch vụ cùng lúc.

*   **Terminal 1 (AI Service):**
    ```bash
    cd ai_service
    # Nhớ activate venv nếu chưa
    .\venv\Scripts\activate
    uvicorn inference.main:app --reload --port 8000
    ```

*   **Terminal 2 (Backend):**
    ```bash
    cd backend
    yarn dev
    # Server sẽ chạy tại port 5001
    ```

*   **Terminal 3 (Frontend):**
    ```bash
    cd frontend
    yarn dev
    # Web sẽ chạy tại http://localhost:5173
    ```

---

### PHẦN 4: KỊCH BẢN TEST (SCENARIO)

Dưới đây là quy trình để test tính năng tạo Warehouse, Join Warehouse và Stream dữ liệu.

#### Kịch bản 1: Tạo tài khoản Quản lý (Manager) & Tạo Warehouse
1.  Truy cập `http://localhost:5173`.
2.  Chọn **Sign Up**.
3.  Đăng ký tài khoản:
    *   Username: `manager1`
    *   Role: **Manager**
4.  Đăng nhập với `manager1`.
5.  Hệ thống sẽ yêu cầu tạo Warehouse. Nhập tên danh mục (ví dụ: "Vang Đà Lạt") -> Bấm **Create**.
6.  Sau khi vào Dashboard, nhìn vào thẻ "Warehouse Information".
7.  Bấm nút **Share Warehouse** (hoặc Generate Token).
8.  **Copy mã Token** hiện ra (ví dụ: `abc123xyz...`).
9.  Ghi nhớ **Warehouse ID** (ví dụ: ID là **1**).

#### Kịch bản 2: Tạo tài khoản Kỹ sư (Engineer) & Join Warehouse
1.  Mở trình duyệt ẩn danh (hoặc đăng xuất).
2.  Đăng ký tài khoản mới:
    *   Username: `engineer1`
    *   Role: **Engineer**
3.  Đăng nhập. Hệ thống sẽ yêu cầu **Join Warehouse**.
4.  Paste mã Token đã copy ở Kịch bản 1 vào -> Bấm **Join**.
5.  Nếu thành công, Engineer sẽ vào được Dashboard và thấy dữ liệu của Warehouse ID 1.

#### Kịch bản 3: Stream dữ liệu giả lập (Simulation)
Bây giờ hệ thống đã có người dùng, nhưng chưa có dữ liệu cảm biến. Ta sẽ chạy script giả lập.

1.  Mở thêm 1 Terminal nữa tại thư mục gốc (`DE Integration Project`).
2.  Chạy lệnh sau để bắn dữ liệu vào **Warehouse 1** (ID của Manager tạo ở trên):
    ```bash
    # Nếu chưa cài thư viện requests cho python gốc
    pip install requests 

    # Chạy giả lập cho Warehouse ID 1
    python simulation.py --warehouse 1
    ```
3.  **Kiểm tra kết quả:**
    *   Quay lại trình duyệt của Manager hoặc Engineer.
    *   Vào trang **Realtime**.
    *   Bạn sẽ thấy dữ liệu nhảy liên tục, biểu đồ cập nhật và AI dự đoán chất lượng rượu (Quality Score).

#### Kịch bản 4: Test đa luồng (Optional)
*   Tạo thêm tài khoản `manager2` -> Tạo Warehouse mới (sẽ có ID là 2).
*   Mở terminal chạy thêm 1 luồng giả lập cho Warehouse 2:
    ```bash
    python simulation.py --warehousepython simulation.py --warehouse 2
    ```
*   Lúc này, `manager1` chỉ thấy dữ liệu của Warehouse 1, `manager2` chỉ thấy dữ liệu của Warehouse 2. Hệ thống hoạt động độc lập chính xác.*   Lúc này, `manager1` chỉ thấy dữ liệu của Warehouse 1, `manager2` chỉ thấy dữ liệu của Warehouse 2. Hệ thống hoạt động độc lập chính xác.