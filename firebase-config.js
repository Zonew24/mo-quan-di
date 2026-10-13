// Cấu hình Firebase (Firebase console → Project settings → Your apps → Web app).
// apiKey web của Firebase không phải secret; quyền truy cập do Realtime Database Rules quyết định.
// Để null: chế độ vote chỉ chạy giữa các tab trên CÙNG một máy (dùng để thử). Hướng dẫn: docs/vote-setup.md
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCt5bWqoHkuco-3bsmo1vMeN-sjD7ccjCM',
  authDomain: 'test-8cf1d.firebaseapp.com',
  databaseURL: 'https://test-8cf1d-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'test-8cf1d',
  appId: '1:13182854984:web:42dc3e14e9752721e4357d',
};

// Link trang vote gửi cho cả lớp. Để trống: tự lấy theo địa chỉ đang mở game (phải là http/https, không phải file://).
window.VOTE_URL = '';
