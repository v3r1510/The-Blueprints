"use client";

import { IParkingSpot } from "@/models/ParkingSpot";

interface ParkingReservationModalProps {
  isOpen: boolean;
  spot: IParkingSpot | null;
  isReserving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ParkingReservationModal({
  isOpen,
  spot,
  isReserving,
  onClose,
  onConfirm,
}: ParkingReservationModalProps) {
  if (!isOpen || !spot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f0f13] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-white font-bold text-lg mb-1">Confirm Parking</h3>
        <p className="text-white/50 text-xs mb-6">Flat rate due when you end your session.</p>

        <div className="space-y-3 mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Lot</span>
            <span className="text-white font-medium">{spot.lotNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Location</span>
            <span className="text-white font-medium">{spot.zone}</span>
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-white/10">
            <span className="text-white/50">Session total</span>
            <span className="text-violet-400 font-mono">
              ${spot.flatRate.toFixed(2)} <span className="text-white/40 text-xs">flat</span>
            </span>
          </div>
          <div className="flex justify-between text-xs pt-1">
            <span className="text-white/40">Pre-authorization Hold</span>
            <span className="text-white/60">$10.00</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isReserving}
            className="flex-1 py-3 rounded-lg border border-white/10 text-white/70 text-xs font-bold hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isReserving}
            className="flex-1 py-3 rounded-lg bg-violet-500 text-black text-xs font-bold hover:bg-violet-400 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
          >
            {isReserving ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
