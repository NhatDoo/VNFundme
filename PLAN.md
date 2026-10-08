# Ke hoach phat trien do an VNFundme

Nguon tham chieu: de cuong do an "Xay dung website quan ly va quyen gop quy tu thien".

Ngay lap plan: 15/09/2026.

Quy uoc checklist:

- [x] Da lam trong codebase.
- [ ] Chua lam hoac chua du de xem la hoan thanh.

## 1. Muc tieu tong quat

Xay dung website quan ly va quyen gop quy tu thien, tap trung vao tinh minh bach, an toan giao dich va de theo doi dong tien.

He thong can ho tro:

- [ ] Nguoi quyen gop xem chien dich, quyen gop va theo doi lich su dong gop.
- [ ] Nguoi to chuc tao va quan ly chien dich gay quy.
- [ ] Quan tri vien kiem duyet chien dich, quan ly nguoi dung, giao dich va bao cao.
- [ ] Cong khai tien do quyen gop va thong tin su dung quy.
- [ ] Tich hop AI tu van sau khi cac chuc nang loi da on dinh.

## 2. Pham vi MVP

MVP nen uu tien cac chuc nang cot loi sau:

- [x] Dang ky, dang nhap co tra JWT.
- [x] Bam mat khau bang bcrypt khi dang ky va doi mat khau.
- [x] JWT guard bao ve route.
- [x] Phan quyen theo vai tro: Donor, Organizer, Admin.
- [x] Quan ly chien dich tu thien.
- [x] Kiem duyet chien dich truoc khi cong khai.
- [x] Xem danh sach va chi tiet chien dich.
- [x] Tao giao dich quyen gop.
- [x] Co schema Donation/Payment voi trang thai Pending, Success, Failed, Cancelled.
- [x] Cap nhat so tien hien tai cua chien dich khi thanh toan thanh cong.
- [x] Lich su quyen gop va bao cao minh bach co ban.
- [x] Dashboard admin co thong ke tong quan.

## 3. Vai tro nguoi dung

### Donor

- [x] Dang ky, dang nhap.
- [x] Xem danh sach chien dich dang hoat dong.
- [x] Tim kiem va loc chien dich.
- [x] Xem chi tiet chien dich.
- [x] Quyen gop cho chien dich.
- [x] Xem lich su quyen gop.
- [x] Theo doi tien do va cap nhat su dung quy.

### Organizer

- [x] Dang ky, dang nhap.
- [x] Tao chien dich moi.
- [x] Cap nhat thong tin chien dich cua minh.
- [x] Theo doi tong tien da nhan.
- [x] Cap nhat tinh hinh su dung quy.
- [x] Xem danh sach nguoi quyen gop cho chien dich cua minh.

### Admin

- [x] Dang nhap vao khu quan tri.
- [x] Quan ly nguoi dung.
- [x] Khoa/mo khoa tai khoan.
- [x] Quan ly danh muc chien dich.
- [x] Duyet hoac tu choi chien dich.
- [x] Quan ly giao dich va khoan quyen gop.
- [x] Theo doi tien do cac chien dich.
- [x] Xem thong ke va bao cao he thong.

## 4. Module backend can xay dung

### Auth module

- [x] Register.
- [x] Login.
- [x] Refresh token endpoint.
- [x] Change password.
- [x] Hash password bang bcrypt.
- [x] JWT guard.
- [x] Role guard.

### User module

- [x] Xem thong tin ca nhan.
- [x] Cap nhat ho so.
- [x] Admin quan ly user.
- [x] Khoa/mo khoa user.

### Campaign module

- [x] Tao chien dich.
- [x] Cap nhat chien dich.
- [x] Xoa/ket thuc chien dich.
- [x] Xem danh sach chien dich.
- [x] Xem chi tiet chien dich.
- [x] Admin duyet chien dich.
- [x] Tim kiem va loc chien dich.

### Donation module

- [x] Tao donation pending.
- [x] Luu lich su quyen gop.
- [x] Co quan he Donation voi Campaign va User trong schema.
- [x] Cap nhat trang thai donation sau thanh toan.

### Payment module

- [x] Tao payment request.
- [x] Xu ly callback tu cong thanh toan.
- [x] Doi trang thai payment.
- [x] Dam bao chi cong tien vao campaign khi payment thanh cong.
- [x] Xu ly rollback/khong cap nhat sai neu giao dich loi.

### Transparency/Report module

- [x] Danh sach dong gop cong khai.
- [x] Bao cao su dung quy.
- [x] Thong ke tong tien, so luot quyen gop, tien do chien dich.

### AI module

- [ ] Lam sau khi MVP on dinh.
- [ ] Tu van chien dich phu hop.
- [ ] Tra loi cau hoi ve quy trinh quyen gop.
- [ ] Co the dung RAG voi du lieu campaign, FAQ va quy dinh he thong.

## 5. Database du kien

Cac bang/chuc nang nen co:

- [x] User.
- [x] Role hoac enum role trong User.
- [x] Campaign.
- [x] CampaignCategory.
- [x] Donation.
- [x] Payment.
- [x] FundUsageReport.
- [x] CampaignUpdate.
- [ ] AuditLog.

Trang thai nen co:

- [x] CampaignStatus: Draft, PendingReview, Active, Rejected, Completed, Cancelled.
- [x] DonationStatus: Pending, Success, Failed, Cancelled.
- [x] PaymentStatus: Pending, Success, Failed.
- [x] UserStatus: Active, Locked.

## 6. Plan theo thoi gian

### Tuan 4: 14/09/2026 - 20/09/2026

Muc tieu: Hoan thien nen tang quyen gop va quy trinh thanh toan.

- [x] Chot schema co ban cho Campaign, Donation, Payment.
- [x] Hoan thien register/login/change password co ban.
- [x] Them role cho user.
- [x] Tao API tao donation.
- [x] Tao flow payment pending.
- [x] Cap nhat campaign.current khi payment success.
- [ ] Viet test cho cac service lien quan den password va donation.

### Tuan 5: 21/09/2026 - 27/09/2026

Muc tieu: Xu ly loi giao dich va rollback logic.

- [x] Xu ly payment failed/cancelled.
- [x] Dam bao donation khong bi cong tien hai lan.
- [x] Them transaction Prisma cho cac cap nhat quan trong.
- [ ] Them audit log cho payment callback.
- [ ] Test cac case thanh toan loi, callback lap lai, user huy giao dich.

### Tuan 6: 28/09/2026 - 04/10/2026

Muc tieu: Hoan thien user/profile va kiem tra thong tin nguoi dung.

- [x] API cap nhat profile.
- [x] API xem profile.
- [x] Admin xem danh sach user.
- [x] Admin khoa/mo khoa user.
- [x] Validate phone/email khi dang ky bang DTO.
- [x] Them guard chan user bi khoa.

### Tuan 7: 05/10/2026 - 11/10/2026

Muc tieu: Hoan thien UI/UX.

- [x] Giao dien danh sach chien dich.
- [x] Giao dien chi tiet chien dich.
- [x] Giao dien dang ky/dang nhap.
- [x] Giao dien quyen gop.
- [x] Giao dien lich su quyen gop.
- [x] Giao dien organizer quan ly chien dich.
- [x] Giao dien admin dashboard co ban.

### Tuan 8: 12/10/2026 - 18/10/2026

Muc tieu: Tich hop AI tu van.

- [ ] Xac dinh pham vi AI: FAQ, goi y chien dich, huong dan quyen gop.
- [ ] Tao AI service rieng neu can.
- [ ] Chuan bi du lieu cho RAG.
- [ ] Tao API chat/tuvan.
- [ ] Gan vao frontend.

### Tuan 9: 19/10/2026 - 25/10/2026

Muc tieu: Hoan thien chuc nang chinh.

- [x] Hoan thien campaign approval.
- [x] Hoan thien bao cao minh bach.
- [x] Hoan thien organizer dashboard.
- [x] Hoan thien admin quan ly giao dich.
- [x] Kiem tra luong nguoi dung tu dau den cuoi.

### Tuan 10: 26/10/2026 - 01/11/2026

Muc tieu: Nang cao va toi uu.

- [ ] Toi uu query database.
- [ ] Phan trang, tim kiem, loc du lieu.
- [ ] Them upload anh chien dich neu co storage.
- [ ] Cai thien bao mat API.
- [ ] Them rate limit neu can.

### Tuan 11 - 14: 02/11/2026 - 29/11/2026

Muc tieu: Kiem thu, sua loi, on dinh san pham.

- [ ] Unit test service quan trong.
- [ ] E2E test cac flow chinh.
- [ ] Test bao mat co ban theo OWASP.
- [ ] Test phan quyen.
- [ ] Test UI tren nhieu kich thuoc man hinh.
- [ ] Sua loi va lam min giao dien.

### Tuan 15: 30/11/2026 - 06/12/2026

Muc tieu: Hoan thien bao cao va demo.

- [ ] Chup man hinh cac chuc nang.
- [ ] Viet chuong cai dat, ket qua va danh gia.
- [ ] Chuan bi slide demo.
- [ ] Tao data demo.
- [ ] Tap demo flow: donor quyen gop, organizer quan ly, admin kiem duyet.

## 7. Thu tu uu tien hien tai

- [x] Auth va bao mat mat khau co ban.
- [x] Role va phan quyen.
- [x] Campaign CRUD.
- [x] Campaign approval.
- [x] Donation/payment flow.
- [x] Bao cao minh bach.
- [x] Admin dashboard.
- [ ] Frontend hoan chinh.
- [ ] AI tu van.
- [ ] Kiem thu va bao cao.

## 8. Tieu chi hoan thanh MVP

- [x] User co the dang ky va dang nhap.
- [x] Password khong luu plain text.
- [x] Admin co the duyet chien dich thong qua endpoint nghiep vu.
- [x] Payment co schema trang thai ro rang.
- [x] Chien dich chi tang current amount khi payment success.
- [x] Co lich su quyen gop.
- [x] Co trang cong khai tien do chien dich.
- [x] Admin co dashboard xem tong quan.
- [x] He thong build, lint va test thanh cong o thoi diem 15/09/2026.

## 9. Rui ro can chu y

- Scope qua rong neu lam AI qua som.
- Payment callback de bi cap nhat lap neu khong co idempotency.
- Thieu phan quyen co the lam user sua du lieu khong thuoc ve minh.
- Tinh minh bach yeu cau du lieu giao dich phai nhat quan.
- Bao cao do an can anh chup va mo ta luong nghiep vu, nen can lam demo data som.

## 10. Viec nen lam tiep theo trong codebase

- [x] Them role/status vao Prisma schema cho User.
- [x] Them CampaignStatus vao Prisma schema.
- [x] Tao Campaign module/service/controller.
- [x] Chuan hoa Donation va Payment service.
- [x] Dung Prisma transaction khi cap nhat donation/payment/campaign.
- [ ] Them tests cho register hash password va payment success.
- [x] Xay frontend form register/login/campaign list/campaign detail.
