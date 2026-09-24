import { useState } from 'react';
import { Button } from './index';

export interface SmsNotificationPayload {
  recipientPhone: string;
  recipientName: string;
  citizenId?: string;
  username: string;
  sentAt?: string;
  senderName?: string;
  message: string;
  status?: string;
}

interface SmsSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  smsData: SmsNotificationPayload | null;
}

export default function SmsSimulatorModal({
  isOpen,
  onClose,
  smsData,
}: SmsSimulatorModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !smsData) return null;

  const now = new Date();
  const timeString = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });

  function handleCopy() {
    if (!smsData) return;
    navigator.clipboard.writeText(smsData.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Close Button top right outside phone */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm flex items-center gap-1 cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition"
        >
          ✕ Đóng mô phỏng
        </button>

        {/* ── Smartphone Chassis Mockup ─────────────────────────────── */}
        <div className="w-[330px] rounded-[44px] bg-slate-950 p-3 shadow-2xl ring-1 ring-white/20 border-4 border-slate-700">
          {/* Inner Screen */}
          <div className="relative rounded-[34px] bg-linear-to-b from-slate-900 via-emerald-950/40 to-slate-900 p-4 text-white overflow-hidden min-h-[540px] flex flex-col justify-between border border-slate-800">
            
            {/* Top Speaker & Dynamic Island / Notch */}
            <div className="flex justify-between items-center px-3 pt-1 text-2xs font-semibold text-slate-300">
              <span>{timeString}</span>
              <div className="h-4 w-24 bg-black rounded-full mx-auto flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-slate-800 ring-1 ring-slate-700 mr-2" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <span>📶</span>
                <span className="text-emerald-400">100% 🔋</span>
              </div>
            </div>

            {/* Lockscreen Header Clock */}
            <div className="text-center pt-6 space-y-1">
              <span className="text-slate-400 text-2xs uppercase tracking-wider capitalize font-medium">
                {dateString}
              </span>
              <h2 className="text-4xl font-light tracking-tight text-white/90 font-sans">
                {timeString}
              </h2>
            </div>

            {/* ── Animated Incoming SMS Banner (Notification Center) ── */}
            <div className="my-auto space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-xl space-y-2 animate-in slide-in-from-top-4 duration-300">
                {/* Header info */}
                <div className="flex items-center justify-between text-2xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-md bg-emerald-500 flex items-center justify-center text-xs shadow-xs">
                      💬
                    </div>
                    <span className="font-bold text-emerald-300">
                      {smsData.senderName || 'PlotFarm SMS'}
                    </span>
                  </div>
                  <span className="text-white/60 text-3xs font-medium">VỪA XONG</span>
                </div>

                {/* Recipient Phone pill */}
                <div className="flex items-center justify-between bg-black/30 px-2 py-1 rounded-md text-3xs font-mono text-slate-300">
                  <span>Gửi tới: <strong>{smsData.recipientPhone}</strong></span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đã chuyển giao
                  </span>
                </div>

                {/* SMS Message Body */}
                <div className="p-2.5 rounded-xl bg-black/40 text-xs text-slate-100 leading-relaxed font-sans border border-white/5">
                  <p className="whitespace-pre-line">{smsData.message}</p>
                </div>

                {/* Account details preview */}
                <div className="flex justify-between text-3xs text-slate-400 pt-1 border-t border-white/10">
                  <span>Tài khoản: <strong className="text-white">{smsData.username}</strong></span>
                  <span>Trạng thái: <strong className="text-emerald-400 uppercase font-bold">KÍCH HOẠT</strong></span>
                </div>
              </div>

              {/* Simulation explanation callout */}
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-center text-3xs text-emerald-300">
                ⚡ <em>Mô phỏng tin nhắn SMS gửi qua viễn thông tới số <strong>{smsData.recipientPhone}</strong> của Nông dân</em>
              </div>
            </div>

            {/* Bottom Actions inside Phone */}
            <div className="space-y-2 pt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopy}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 shadow-lg shadow-emerald-900/40"
              >
                {copied ? '✅ Đã sao chép nội dung tin nhắn!' : '📋 Sao chép nội dung SMS'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="w-full border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs py-2"
              >
                Hoàn tất &amp; Đóng
              </Button>
            </div>

            {/* Home Indicator Bar */}
            <div className="pt-2 pb-0.5 flex justify-center">
              <div className="h-1 w-32 bg-white/40 rounded-full" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
