import { printLight } from '../../lib/print';
import React from 'react';
import { PaymentReceipt } from '../../types';
import { Printer, Download, X, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const handlePrint = () => {
    printLight();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="print-area relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        
        {/* Action Bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold tracking-wide">Official Digital Fee Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body - Styled consistently for print and view */}
        <div className="p-8 bg-white text-slate-900 print:p-6" id="printable-receipt">
          {/* Header with Academy Crest */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <img
                src="/vrm-emblem.jpg"
                alt="VRM IAS Academy Emblem"
                className="w-16 h-16 rounded-full object-cover border border-amber-200 shadow-xs"
              />
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">VRM IAS ACADEMY</h2>
                <p className="text-xs text-slate-500 font-medium">Center for Civil Services Mentorship & Public Policy</p>
                <p className="text-xs text-slate-400">Anna Nagar, Chennai - 600040 · Ph: +91 98401 23456</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PAYMENT CONFIRMED</span>
              </span>
              <p className="text-xs font-mono text-slate-500 mt-2">Receipt No:</p>
              <p className="text-sm font-mono font-bold text-slate-900">{receipt.receiptNumber}</p>
            </div>
          </div>

          {/* Student & Transaction Meta Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Student Name</p>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">{receipt.studentName}</p>
              <p className="text-slate-500 mt-2 font-medium">Roll Number</p>
              <p className="font-mono font-semibold text-slate-800 mt-0.5">{receipt.studentRollNumber}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Date & Time</p>
              <p className="font-medium text-slate-900 mt-0.5">{receipt.paidAt}</p>
              <p className="text-slate-500 mt-2 font-medium">Payment Mode</p>
              <p className="font-semibold text-slate-900 mt-0.5">{receipt.paymentMethod}</p>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Description / Program</th>
                  <th className="px-4 py-2.5">Allocated Batch</th>
                  <th className="px-4 py-2.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{receipt.courseName}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Civil Services Mentorship Program & Digital Portal Access</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{receipt.batchName}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                    ₹{receipt.amountPaid.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right text-slate-700">Total Remittance</td>
                  <td className="px-4 py-3 text-right font-mono text-base font-bold text-slate-900 tabular-nums">
                    ₹{receipt.amountPaid.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Transaction Metadata & QR Code Simulation */}
          <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-4 mb-6">
            <div className="space-y-1">
              <p className="text-slate-500">
                <span className="font-medium">Txn Reference:</span> <span className="font-mono text-slate-700">{receipt.transactionReference}</span>
              </p>
              <p className="text-slate-500">
                <span className="font-medium">Authorized Registrar:</span> <span className="text-slate-700">{receipt.receivedBy}</span>
              </p>
              {receipt.notes && (
                <p className="text-slate-500 italic text-[11px] mt-1">{receipt.notes}</p>
              )}
            </div>
            
            {/* Stamp & Seal */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-600/60 flex flex-col items-center justify-center p-1 text-center bg-amber-50/50">
                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">VRM IAS</span>
                <span className="text-[8px] text-amber-700 font-semibold">ACCOUNTS</span>
                <span className="text-[8px] font-mono text-amber-900">SEALED</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Authorized Signatory</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 text-center leading-relaxed">
            This is a computer-generated digital receipt issued by VRM IAS Academy ERP. Valid for official records and fee reconciliation.
          </div>
        </div>

        {/* Modal Close Footer (hidden in print) */}
        <div className="flex justify-end gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            Close Receipt
          </button>
        </div>

      </div>
    </div>
  );
};
