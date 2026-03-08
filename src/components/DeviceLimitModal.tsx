import { Monitor, Smartphone, LogOut, X } from "lucide-react";

export const DeviceLimitModal = ({ deviceInfo, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
    <div className="bg-[#1A1F2C] w-full max-w-md border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-white">Device Limit</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white"><X size={20}/></button>
      </div>
      
      <p className="text-gray-400 mb-6 text-sm">You are already logged in on another device. CineStream limits active sessions to 1 device at a time.</p>
      
      <div className="bg-white/5 rounded-xl p-4 mb-8 border border-white/5 flex items-center gap-4">
        <div className="p-3 bg-primary/20 rounded-lg text-primary">
          {deviceInfo.device === 'mobile' ? <Smartphone size={24} /> : <Monitor size={24} />}
        </div>
        <div>
          <p className="font-semibold text-white">{deviceInfo.browser} on {deviceInfo.os}</p>
          <p className="text-xs text-gray-500">Last active: {deviceInfo.last_login}</p>
        </div>
      </div>

      <button 
        onClick={onConfirm}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <LogOut size={20} /> Logout other device & Sign In
      </button>
    </div>
  </div>
);
