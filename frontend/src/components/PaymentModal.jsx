import { useState } from 'react';

const PaymentModal = ({ isOpen, onClose, selectedPackage, onConfirm }) => {
    const [paymentMethod, setPaymentMethod] = useState('MOMO');

    if (!isOpen || !selectedPackage) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-fade-in-up">
                {/* Nút Đóng */}
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="p-8">
                    <p className="text-blue-600 text-xs font-bold tracking-wider mb-1 uppercase">Nâng cấp tài khoản</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 mb-6">Thanh toán gói dịch vụ</h3>
                    
                    {/* Khối Order Summary */}
                    <div className="flex items-center justify-between bg-blue-50/50 border border-gray-100 rounded-2xl p-5 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500 rounded-xl p-3 text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Gói đã chọn</p>
                                <p className="text-slate-900 font-bold text-lg">{selectedPackage.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Tổng cộng</p>
                            <p className="text-slate-900 font-bold text-lg">{selectedPackage.price === 0 ? 'Miễn phí' : `${selectedPackage.price.toLocaleString()} VNĐ`}</p>
                        </div>
                    </div>

                    {/* Chọn phương thức thanh toán */}
                    <h4 className="font-bold text-slate-900 mb-4">Chọn phương thức thanh toán</h4>
                    <div className="space-y-3 mb-8">
                        {/* Option MOMO */}
                        <label className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'MOMO' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="flex items-center gap-4">
                                <input type="radio" name="paymentMethod" value="MOMO" checked={paymentMethod === 'MOMO'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center text-white font-bold text-xl">M</div>
                                <div>
                                    <p className="font-bold text-slate-900">Ví MoMo</p>
                                    <p className="text-sm text-gray-500">Khuyên dùng</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wide">Đề xuất</span>
                        </label>

                        {/* Option VNPAY */}
                        <label className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="flex items-center gap-4">
                                <input type="radio" name="paymentMethod" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">V</div>
                                <div>
                                    <p className="font-bold text-slate-900">VNPAY</p>
                                    <p className="text-sm text-gray-500">ATM / QR Code</p>
                                </div>
                            </div>
                        </label>

                        {/* Option STRIPE */}
                        <label className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'STRIPE' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="flex items-center gap-4">
                                <input type="radio" name="paymentMethod" value="STRIPE" checked={paymentMethod === 'STRIPE'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">S</div>
                                <div>
                                    <p className="font-bold text-slate-900">Thẻ tín dụng</p>
                                    <p className="text-sm text-gray-500">Visa, Mastercard</p>
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Nút bấm thanh toán */}
                    <button 
                        onClick={() => onConfirm(paymentMethod)}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg shadow-blue-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Thanh toán an toàn • {selectedPackage.price === 0 ? '0đ' : `${selectedPackage.price.toLocaleString()}đ`}
                    </button>
                    <p className="text-sm text-center text-green-600 mt-4 flex items-center justify-center gap-1 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        Kích hoạt ngay lập tức sau khi thanh toán thành công
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;