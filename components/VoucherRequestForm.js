import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CSVLink } from 'react-csv';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const VoucherRequestForm = () => {
  const [voucher, setVoucher] = useState({
    payee: '',
    head_of_account: '',
    payment_description: '',
    amount: '',
  });
  const [approvedVouchers, setApprovedVouchers] = useState([]);

  useEffect(() => {
    fetchApprovedVouchers();
  }, []);

  const fetchApprovedVouchers = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('status', 'approved');
    if (error) {
      console.error('Error fetching approved vouchers:', error);
    } else {
      setApprovedVouchers(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('vouchers').insert([{
      ...voucher,
      voucher_number: `VOUCHER-${Date.now()}`,
      prepared_by: supabase.auth.user().id,
      status: 'pending',
    }]);
    if (error) {
      console.error('Error creating voucher:', error);
    } else {
      console.log('Voucher created successfully:', data);
      setVoucher({
        payee: '',
        head_of_account: '',
        payment_description: '',
        amount: '',
      });
    }
  };

  const exportToPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;
    page.drawText('Approved Vouchers', {
      x: 50,
      y,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    approvedVouchers.forEach((voucher) => {
      page.drawText(`Voucher Number: ${voucher.voucher_number}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 15;
      page.drawText(`Payee: ${voucher.payee}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 15;
      page.drawText(`Amount: ${voucher.amount}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 30;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'approved_vouchers.pdf';
    link.click();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Payee"
          value={voucher.payee}
          onChange={(e) => setVoucher({ ...voucher, payee: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Head of Account"
          value={voucher.head_of_account}
          onChange={(e) => setVoucher({ ...voucher, head_of_account: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Payment Description"
          value={voucher.payment_description}
          onChange={(e) => setVoucher({ ...voucher, payment_description: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={voucher.amount}
          onChange={(e) => setVoucher({ ...voucher, amount: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
          Submit Voucher
        </button>
      </form>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Export Approved Vouchers</h2>
        <div className="space-x-2">
          <CSVLink
            data={approvedVouchers}
            filename="approved_vouchers.csv"
            className="p-2 bg-green-500 text-white rounded"
          >
            Export to CSV
          </CSVLink>
          <button
            onClick={exportToPDF}
            className="p-2 bg-red-500 text-white rounded"
          >
            Export to PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherRequestForm;
