// Nội dung game MỞ QUÁN ĐI! — mọi câu thoại có giọng đều có dạng [người nói, câu].
// Sửa lời thoại xong nhớ chạy: node mo-quan-di/tools/gen-tts.js

const CHARS = {
  va:    { name: 'Vân Anh',      role: 'Bạn cùng phòng',          color: '#3b82c4' },
  bb:    { name: 'Bình Bình',    role: 'Bạn cùng phòng',          color: '#22a99a' },
  tung:  { name: 'Tùng',         role: 'Bạn thích làm lớn',       color: '#4caf50' },
  vd:    { name: 'Việt Dương',   role: 'Khách quen',              color: '#f08a24' },
  trang: { name: 'Trang',        role: 'Hay review đồ ăn',        color: '#e86fa5' },
  duc:   { name: 'Nhật Đức',     role: 'Anh khóa trên, đang làm startup', color: '#8b9bb0' },
  hh:    { name: 'Ông Hoàn Hảo', role: 'Chủ quán đối diện',       color: '#d4af37' },
};

const VOICES = {
  va:    { v: 'vi-VN-HoaiMyNeural',  rate: '-2%',  pitch: '-2Hz' },
  bb:    { v: 'vi-VN-NamMinhNeural', rate: '+12%', pitch: '+8Hz' },
  tung:  { v: 'vi-VN-NamMinhNeural', rate: '+8%',  pitch: '+2Hz' },
  vd:    { v: 'vi-VN-NamMinhNeural', rate: '+8%',  pitch: '+10Hz' },
  trang: { v: 'vi-VN-HoaiMyNeural',  rate: '+10%', pitch: '+4Hz' },
  duc:   { v: 'vi-VN-NamMinhNeural', rate: '-6%',  pitch: '-8Hz' },
  hh:    { v: 'vi-VN-NamMinhNeural', rate: '-16%', pitch: '-18Hz' },
};

// Thẻ À HA! theo thứ tự chương. say = câu Nhật Đức đọc.
const AHA = [
  { term: 'MVP · Launch sớm', en: 'Minimum Viable Product',
    means: 'Ra mắt bản **đơn giản nhất** ngay. Khách thật sẽ chỉ cho bạn cần sửa gì.',
    video: 'Chờ hoàn hảo mới launch thì lỡ thời điểm. Ra mắt sớm, sửa dần.',
    say: ['duc', 'Thứ cậu vừa làm, dân startup gọi là MVP. Bán bản đơn giản nhất ngay, rồi để khách thật dạy mình.'] },
  { term: 'Landing page', en: 'Trang giới thiệu',
    means: 'Trang web đầu tiên của startup chính là **tấm biển**: bán gì, cho ai, giá bao nhiêu, làm sao để có.',
    video: 'Người lướt qua chỉ liếc vài giây. Nói rõ, nói ngắn, có nút hành động.',
    say: ['duc', 'Tấm biển đó, trên mạng gọi là landing page. Người ta chỉ liếc vài giây, nên phải nói rõ: bán gì, giá bao nhiêu, làm sao để mua.'] },
  { term: 'Friends & family launch', en: 'Ra mắt cho người quen',
    means: 'Cho người quen dùng trước để **bắt lỗi to**. Ngồi cạnh xem họ dùng.',
    video: 'Người quen thường không phải khách mục tiêu. Sửa xong lỗi to thì rời giai đoạn này thật nhanh.',
    say: ['duc', 'Đó là friends and family launch. Người quen giúp bắt lỗi to. Nhưng họ hay khen cho vui, nên sửa xong thì ra bán cho người lạ ngay.'] },
  { term: 'Khách "cháy nhà"', en: 'Hair-on-fire user',
    means: 'Đừng bán cho đám đông chung chung. Đến tận chỗ người **đang cần gấp**. Họ mua ngay dù sản phẩm còn thô.',
    video: 'Lugg ra tận bãi đỗ xe IKEA, mời người đang vật lộn chở tủ to về nhà, khi app còn chưa làm xong.',
    say: ['duc', 'Cậu vừa tìm ra khách cháy nhà: người đang cần gấp. Startup Lugg cũng vậy, ra tận bãi xe IKEA mời người đang không chở nổi tủ về nhà.'] },
  { term: 'Launch trên cộng đồng', en: 'Hacker News, Reddit, Product Hunt…',
    means: 'Các diễn đàn này giống group KTX: **viết như người thật**, kể bạn là ai, nhờ góp ý, rồi **trả lời từng bình luận**.',
    video: 'Magic đăng lên Reddit và Hacker News, có 40.000 người đăng ký chỉ trong một cuối tuần.',
    say: ['duc', 'Group KTX của cậu, với startup là Hacker News hay Reddit. Viết như người thật, rồi ở lại trả lời từng bình luận. Magic làm vậy và có bốn mươi nghìn người đăng ký trong một cuối tuần.'] },
  { term: 'Đừng trả tiền để launch', en: 'No pay-to-play',
    means: 'Lượt xem mua bằng tiền ≠ khách thật. **Tự nhắn từng người** có đúng khách của bạn: miễn phí mà trúng.',
    video: 'Joy tự gửi email cho hơn 50 blogger và không trả đồng nào.',
    say: ['duc', 'Bài học: đừng trả tiền để được launch. Joy tự gửi email cho hơn năm mươi blogger, không mất đồng nào, mà toàn đúng người.'] },
  { term: 'Email list · Waitlist · Referral', en: 'Danh sách khách, đặt trước, mời bạn',
    means: 'Danh sách khách quen là **tài sản**: mỗi lần ra món có sẵn người để báo. Cho đặt trước + thưởng khi mời bạn → **khách kéo khách**.',
    video: 'Cymmetria gom email qua từng lần launch. Superhuman có danh sách chờ, người dùng còn đi xin lời mời cho bạn bè.',
    say: ['duc', 'Nhóm Zalo đó chính là email list. Còn đặt trước và mời bạn là waitlist với referral. Superhuman làm vậy, người ta xếp hàng xin lời mời.'] },
  { term: 'Launch again and again', en: 'Launch đi launch lại',
    means: 'Launch **không phải một lần**. Mỗi món mới, mỗi tính năng mới là một lần launch, và mỗi lần lại thêm khách.',
    video: 'Stripe launch liên tục suốt nhiều năm. Glossier ra sản phẩm mới theo lịch đều đặn.',
    say: ['duc', 'Và đây là bài chính: launch không phải một lần. Launch đi, launch lại. Stripe và Glossier làm vậy suốt nhiều năm.'] },
];

// Màn cuối: ghép việc ở quán ↔ thuật ngữ (cùng thứ tự AHA)
const DEEDS = ['🧋 Mở luôn với 1 món', '🪧 Biển ghi rõ món, giá, giờ, QR', '👭 Cho bạn cùng phòng uống thử',
  '🌙 Bán ở cổng KTX đêm thi', '📝 Đăng bài group KTX, trả lời từng bình luận', '✉️ Nhắn Trang thay vì trả TikToker',
  '📱 Nhóm Zalo + đặt trước, mời bạn', '📅 Mỗi tuần một món mới'];

const SIGN_CARDS = [
  { t: 'Trà sữa trân châu', k: 'what', ok: true },
  { t: '15.000đ / ly', k: 'price', ok: true },
  { t: '20h–24h · Cổng KTX', k: 'when', ok: true },
  { t: 'Quét QR đặt trước', k: 'cta', ok: true },
  { t: 'Cho dân thức khuya ôn thi', k: 'who', ok: true },
  { t: '✨ Nâng tầm trải nghiệm vị giác', ok: false },
  { t: '🏆 Thương hiệu từ tâm, vươn tầm quốc tế', ok: false },
  { t: '📜 Câu chuyện thương hiệu (3 trang)', ok: false },
];
const SIGN_ASK = { what: 'Bán gì thế nhỉ?', price: 'Bao nhiêu tiền ta?', when: 'Mấy giờ đóng cửa?', cta: 'Đặt trước kiểu gì?', who: 'Có hợp với mình không?' };

const C = {
  open: [['va', 'Mai cả KTX thi rồi. Tối nay ai cũng thức khuya, khát nước lắm.'],
         ['tung', 'Mở quán trà sữa hả? Khoan! Chờ sáu tháng: sắm xe inox, menu hai mươi món, logo thật xịn rồi hẵng mở.']],
  wait: [['tung', 'Ơ... sinh viên về quê hết rồi. Mà menu hai mươi món vẫn chưa xong.']],
  sold1: [['bb', 'Bán được rồi! Có người chê trân châu hơi cứng. Mai sửa là xong.']],

  sign: [['bb', 'Tối qua nhiều người đi ngang mà không ghé. Biển chỉ ghi mỗi tên quán.'],
         ['bb', 'Làm lại biển đi! Biển chỉ đủ chỗ cho năm mảnh thôi.']],
  signBad: [['bb', 'Khách vẫn hỏi đi hỏi lại. Sửa biển lần nữa nhé?']],

  taste: [['va', 'Nghe nói cậu sắp có món mới, trà sữa khoai môn? Đã ai uống thử chưa?']],
  tasteFriends: [['va', 'Ngọt quá! Bớt đường đi.'], ['bb', 'Khoai môn ít quá, toàn màu tím.']],
  tasteBad: [['bb', 'Toang rồi... Một sao. Giá mà có người thử trước.']],

  where: [['tung', 'Mình biết chỗ đông nhất: phố đi bộ cuối tuần!'], ['va', 'Hay bán ngay trước nhà cho đỡ phải đẩy xe?']],
  wherePho: [['bb', 'Đông thật, nhưng họ đâu có cần mình.']],
  whereNha: [['va', 'Ừ... trước nhà thì vắng thật.']],

  post: [['bb', 'Đăng lên group KTX tám nghìn thành viên đi!']],
  postAd: [['bb', 'Bị coi là spam rồi. Viết lại như người thật xem?']],
  postSleep: [['bb', 'Người ta hỏi mà mình không trả lời, họ đi mất.']],

  tiktok: [['bb', 'Có người quản lý TikToker hai mươi triệu follow nhắn: một clip hai mươi triệu đồng.'],
           ['trang', 'Chào cậu, mình là Trang, hay review đồ ăn quanh trường. Mình chưa thử quán cậu đâu.']],
  tiktokPaid: [['bb', 'Hai triệu lượt xem... mà toàn người ở tỉnh khác. Cháy túi rồi.']],
  trangYes: [['trang', 'Ngon thật nè! Để mình rủ cả hội review đồ ăn qua.']],

  regular: [['vd', 'Quán ngon! Bao giờ có món mới, nhắn mình nha!']],
  regularForget: [['vd', 'Ủa, có món mới hả? Mình không biết luôn.']],
  regularPlain: [['bb', 'Cũng được. Nhưng nếu ai mời bạn thì được giảm giá, chắc còn đông hơn?']],

  weekly: [['duc', 'Giờ đến bài khó nhất: làm lại... mỗi tuần.']],
  lazy: [['vd', 'Lại món cũ à? Tuần này mình nghỉ.']],
  hhWeek: [['hh', 'Chưa hoàn hảo thì chưa mở!'], ['hh', 'Màu sơn này... chưa đủ hoàn hảo.'], ['hh', 'Logo mới... vẫn chưa hoàn hảo.'], ['hh', 'Sao quán cậu đông thế?!']],

  bridge: [['duc', 'Giờ thử xem cậu còn nhớ không: việc ở quán, ứng với từ nào của startup?']],
  end: [['duc', 'Cậu vừa làm hết những gì một founder làm khi launch. Chỉ là bằng trà sữa.'],
        ['hh', 'Quán tôi... tuần sau khai trương. Chắc vậy.']],
};

const RIVAL_NOTES = ['SẮP KHAI TRƯƠNG', 'SẮP KHAI TRƯƠNG (tháng 6)', 'ĐANG CHỌN MÀU SƠN', 'ĐANG ĐỔI LOGO', 'TẠM HOÃN KHAI TRƯƠNG'];
const MENU = [['🍑 Trà đào cam sả', '🍵 Matcha latte', '🍓 Sữa chua dâu'], ['🥥 Cà phê dừa', '🍫 Ca cao muối', '🍋 Trà chanh giã tay'],
  ['🥭 Xoài lắc', '🍮 Trà sữa pudding', '🌸 Trà hoa đậu biếc'], ['🍉 Dưa hấu ép', '🧀 Kem phô mai', '🍯 Trà mật ong']];

const RANKS = [[1, '🏆 Founder bẩm sinh', 'Gần như không vấp lần nào.'], [4, '🚀 Founder đang lên', 'Vấp vài lần, học rất nhanh.'],
  [99, '🧋 Founder lì đòn', 'Sai nhiều, học nhiều. Đúng tinh thần launch!']];

const spoken = s => s.replace(/\*\*/g, '').replace(/(\d+)\.(\d{3})đ/g, '$1$2 đồng').replace(/…/g, '...').replace(/&/g, 'và');

if (typeof module !== 'undefined') module.exports = { CHARS, VOICES, AHA, C, spoken };
