import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';
import { subscriptionApi, authApi } from '../services/api';

const PricingPage = () => {
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);

    // GỌI API LẤY DATA THẬT TỪ CSDL
    useEffect(() => {
        const fetchRealData = async () => {
            try {
                // 1. Lấy thông tin user hiện tại (kiểm tra đăng nhập)
                try {
                    const userRes = await authApi.me();
                    setCurrentUser(userRes.data);
                } catch (userErr) {
                    console.log("Chưa đăng nhập:", userErr);
                }

                // 2. Lấy danh sách gói cước từ CSDL (Backend)
                const pkgRes = await subscriptionApi.getPackages();
                const activePackages = pkgRes.data.filter(pkg => pkg.isActive);
                setPackages(activePackages); 

            } catch (error) {
                console.error("Lỗi khi kết nối Backend:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRealData();
    }, []);

    // HÀM MỞ MODAL (Kiểm tra đăng nhập trước khi mua)
    const openModal = (pkg) => {
        if (!currentUser || !currentUser.id) {
            if (window.confirm("Bạn cần đăng nhập để mua hoặc nâng cấp gói dịch vụ. Chuyển đến trang đăng nhập ngay?")) {
                navigate('/dang-nhap'); 
            }
            return;
        }
        setSelectedPackage(pkg);
        setIsModalOpen(true);
    };

    const handleConfirmPayment = async (paymentGateway) => {
        if (!currentUser?.id) {
            alert("Vui lòng đăng nhập trước khi mua gói!");
            return;
        }

        try {
            const res = await subscriptionApi.purchase(currentUser.id, { 
                packageId: selectedPackage.id, 
                paymentGateway: paymentGateway 
            });
            alert(res.data?.message || "Thanh toán thành công!"); 
            setIsModalOpen(false);
            navigate('/subscription');
        } catch (error) {
            console.error("Lỗi thanh toán:", error);
            alert(error.message || "Có lỗi xảy ra khi gọi API thanh toán.");
        }
    };

    // Hàm phụ trợ ánh xạ Text/Badge chuẩn theo từng mã gói từ Figma
    const getUiMetadata = (code) => {
        switch (code) {
            case 'FREEMIUM':
                return {
                    tag: 'BẮT ĐẦU',
                    desc: 'Những tính năng thiết yếu để luôn được kết nối.',
                    isPro: false,
                    btnText: 'Đang sử dụng',
                };
            case 'PRO_1YR':
                return {
                    tag: 'BẢO VỆ TOÀN DIỆN',
                    desc: 'Phản ứng nhanh hơn khi mỗi giây đều quan trọng.',
                    isPro: true,
                    btnText: 'Nâng cấp ngay',
                };
            default:
                return {
                    tag: 'AN TÂM TRỌN ĐỜI',
                    desc: 'Một lần thanh toán, bảo vệ dài lâu cho gia đình.',
                    isPro: false,
                    btnText: 'Mua một lần',
                };
        }
    };

    if (isLoading) return (
        <div className="text-center mt-20 text-blue-600 font-bold flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Đang tải dữ liệu từ CSDL...
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header / Navbar phụ trợ hiển thị trạng thái đăng nhập thực tế */}
            <header className="bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center mb-12">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    SentinelCare
                </div>
                <div className="flex gap-8 text-sm font-semibold text-gray-500">
                    <span className="text-slate-900 border-b-2 border-blue-600 pb-1 cursor-pointer">Bảng giá</span>
                    <span onClick={() => navigate('/subscription')} className="hover:text-slate-900 cursor-pointer">Gói của tôi</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center uppercase">
                        {currentUser?.fullName ? currentUser.fullName.charAt(0) : '?'}
                    </div>
                    {currentUser?.fullName || 'Chưa đăng nhập'}
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4">
                {/* Tiêu đề chính giống thiết kế Figma[cite: 11] */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <p className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-3">GÓI DỊCH VỤ</p>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#0B2545] leading-tight mb-4">
                        Bảo vệ bạn và người thân <br/>
                        <span className="text-blue-600">trong mọi khoảnh khắc.</span>
                    </h1>
                    <p className="text-lg text-gray-500 mb-8">Chọn mức bảo vệ phù hợp. Nâng cấp hoặc thay đổi bất cứ lúc nào.</p>
                    
                    {/* Badge phụ trợ dưới tiêu đề[cite: 11] */}
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-600">
                        <span className="flex items-center gap-2 text-emerald-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Thanh toán bảo mật
                        </span>
                        <span className="flex items-center gap-2 text-emerald-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Kích hoạt tức thì
                        </span>
                        <span className="flex items-center gap-2 text-rose-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> Đồng hành 24/7
                        </span>
                    </div>
                </div>

                {/* DANH SÁCH THẺ GÓI CƯỚC LẤY TỪ CSDL VÀ ÁP STYLE FIGMA */}
                <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6">
                    {packages.length === 0 ? (
                        <div className="text-red-500 font-bold text-center w-full py-10">Không tìm thấy gói dịch vụ nào trong CSDL!</div>
                    ) : (
                        packages.map((pkg) => {
                            const ui = getUiMetadata(pkg.code);
                            return (
                                <div 
                                    key={pkg.id} 
                                    className={`flex-1 flex flex-col bg-white rounded-3xl p-8 relative transition-all ${
                                        ui.isPro 
                                            ? 'border-2 border-blue-500 shadow-2xl shadow-blue-100 scale-105 z-10' 
                                            : 'border border-gray-200 shadow-sm'
                                    }`}
                                >
                                    {/* Nhãn PHỔ BIẾN NHẤT cho gói Pro[cite: 11] */}
                                    {ui.isPro && (
                                        <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                            <span className="bg-blue-600 text-white text-xs font-bold tracking-widest uppercase py-1.5 px-6 rounded-full shadow-md">
                                                PHỔ BIẾN NHẤT
                                            </span>
                                        </div>
                                    )}
                                    
                                    <p className="text-blue-600 text-xs font-bold tracking-wider uppercase mb-2 mt-2">{ui.tag}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{pkg.name}</h3>
                                    
                                    <div className="mb-3">
                                        <span className="text-4xl font-extrabold text-slate-900">
                                            {pkg.price === 0 ? '0đ' : pkg.price.toLocaleString() + 'đ'}
                                        </span>
                                        <span className="text-gray-500 font-medium"> / {pkg.durationDays ? 'năm' : 'tháng'}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-6 h-12">{ui.desc}</p>
                                    
                                    <div className="w-full h-px bg-gray-100 mb-6"></div>
                                    <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-4">BAO GỒM</p>

                                    {/* Danh sách tính năng động từ CSDL */}
                                    <ul className="space-y-4 mb-8 flex-1">
                                        {pkg.features?.map((feature) => (
                                            <li key={feature.id} className="flex items-start gap-3">
                                                <div className={`${ui.isPro ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-600'} rounded-full p-1 mt-0.5`}>
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <span className="text-slate-700 text-sm font-medium">{feature.name}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button 
                                        onClick={() => openModal(pkg)}
                                        disabled={pkg.price === 0}
                                        className={`w-full py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                                            pkg.price === 0 
                                                ? 'border border-gray-200 text-blue-500 bg-white cursor-not-allowed' 
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                                        }`}
                                    >
                                        <span>{pkg.price === 0 ? ui.btnText : ui.btnText}</span>
                                        {pkg.price > 0 && (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Chú thích chân trang[cite: 12] */}
                <div className="mt-16 text-center text-sm font-medium text-gray-400 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Giá đã bao gồm thuế. Không có chi phí ẩn.
                </div>
            </div>

            {/* Popup thanh toán */}
            <PaymentModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                selectedPackage={selectedPackage} 
                onConfirm={handleConfirmPayment} 
            />
        </div>
    );
};

export default PricingPage;