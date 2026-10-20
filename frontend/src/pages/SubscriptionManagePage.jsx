import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi, authApi } from '../services/api';

const SubscriptionManagePage = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPackage, setCurrentPackage] = useState(null); 
    const [autoRenew, setAutoRenew] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Lấy thông tin user hiện tại
                let userData = null;
                try {
                    const userRes = await authApi.me();
                    userData = userRes.data;
                    setCurrentUser(userData);
                    if (userData?.subscription?.autoRenew !== undefined) {
                        setAutoRenew(userData.subscription.autoRenew);
                    }
                } catch (err) {
                    console.log("Người dùng chưa đăng nhập.", err);
                }

                // 2. Lấy danh sách tất cả các gói từ CSDL
                const pkgRes = await subscriptionApi.getPackages();
                const allPackages = pkgRes.data;

                // 3. Tìm gói mà user đang sử dụng (Nếu chưa đăng nhập hoặc chưa mua, mặc định là FREEMIUM)
                const userPkgCode = userData?.subscription?.packageCode || "FREEMIUM";
                const activePkg = allPackages.find(p => p.code === userPkgCode);
                
                setCurrentPackage(activePkg);

            } catch (error) {
                console.error("Lỗi lấy dữ liệu CSDL:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCancel = async (cancelImmediately) => {
        if (!currentUser?.id) {
            alert("Vui lòng đăng nhập!");
            return;
        }

        const confirmMsg = cancelImmediately 
            ? "CẢNH BÁO: Hủy ngay về gói Miễn phí sẽ mất quyền lợi ngay lập tức?" 
            : "Xác nhận tắt tự động gia hạn?";
            
        if (window.confirm(confirmMsg)) {
            try {
                const res = await subscriptionApi.cancel(currentUser.id, cancelImmediately);
                alert(res.data?.message || "Đã gửi yêu cầu thành công!");
                
                if (!cancelImmediately) {
                    setAutoRenew(false);
                } else {
                    window.location.reload(); 
                }
            } catch (error) {
                console.error(error);
                alert(error.message || "Lỗi khi gọi API hủy gói.");
            }
        }
    };

    if (isLoading) return (
        <div className="text-center mt-20 text-blue-600 font-bold flex justify-center items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Đang đồng bộ dữ liệu...
        </div>
    );

    const expiredAt = currentUser?.subscription?.expiredAt || "Vô thời hạn";

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header SentinelCare */}
            <header className="bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center mb-12">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    SentinelCare
                </div>
                <div className="flex gap-8 text-sm font-semibold text-gray-500">
                    <span onClick={() => navigate('/pricing')} className="hover:text-slate-900 cursor-pointer">Bảng giá</span>
                    <span className="text-slate-900 border-b-2 border-blue-600 pb-1 cursor-pointer">Gói của tôi</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-sm">
                    {currentUser ? (
                        <>
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center uppercase">
                                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                            </div>
                            {currentUser.fullName}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-gray-500">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xs font-bold">?</span>
                            Chưa đăng nhập
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-10">
                    <p className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-2">Tài khoản & Dịch vụ</p>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Quản lý dịch vụ</h1>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Gói hiện tại</p>
                            {/* Lấy tên gói từ CSDL */}
                            <h2 className="text-3xl font-extrabold text-slate-900">
                                {currentPackage ? currentPackage.name : 'FREEMIUM'}
                            </h2>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Đang hoạt động
                        </span>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-5 flex items-center gap-4 mb-8">
                        <div className="bg-white p-3 rounded-xl shadow-sm text-blue-500 border border-gray-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-0.5">Thời hạn gói</p>
                            <p className="text-slate-900 font-bold">Hết hạn: {expiredAt}</p>
                        </div>
                    </div>

                    {/* VẼ DANH SÁCH QUYỀN LỢI TỪ CSDL BẰNG VÒNG LẶP */}
                    {currentPackage?.features && currentPackage.features.length > 0 && (
                        <>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Quyền lợi đang sử dụng</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {currentPackage.features.map((feature) => (
                                    <div key={feature.id} className="flex items-center gap-3">
                                        <div className="text-blue-400 bg-blue-50 p-2 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">{feature.name}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <button onClick={() => navigate('/pricing')} className="w-full py-3.5 border-2 border-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition">
                        Thay đổi gói
                    </button>
                </div>

                {currentPackage?.code !== "FREEMIUM" && (
                    <>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex justify-between items-center mb-8">
                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">Tự động gia hạn</h4>
                                <p className="text-sm text-gray-500">Gói sẽ tự động gia hạn vào ngày hết hạn.</p>
                            </div>
                            <div 
                                onClick={() => setAutoRenew(!autoRenew)}
                                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${autoRenew ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${autoRenew ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-8 text-sm font-medium">
                            <button onClick={() => handleCancel(false)} className="text-red-500 hover:text-red-600 underline">
                                Hủy tự động gia hạn
                            </button>
                            <button onClick={() => handleCancel(true)} className="text-gray-400 hover:text-gray-600 underline">
                                Hủy ngay về gói Miễn phí
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SubscriptionManagePage;