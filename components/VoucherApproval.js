import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Resend } from 'resend';

const resend = new Resend('re_MkUQ2Dyx_2g7mW6NFjVRqkwBQu44PSvvt');

const VoucherApproval = () => {
  const [pendingVouchers, setPendingVouchers] = useState([]);

  useEffect(() => {
    fetchPendingVouchers();
  }, []);

  const fetchPendingVouchers = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('status', 'pending');
    if (error) {
      console.error('Error fetching pending vouchers:', error);
    } else {
      setPendingVouchers(data);
    }
  };

  const sendEmailNotification = async (email, status, voucherNumber) => {
    const { error } = await resend.emails.send({
      from: 'no-reply@relishtech.com',
      to: email,
      subject: `Voucher ${voucherNumber} Status Update`,
      html: `<p>Your voucher <strong>${voucherNumber}</strong> has been <strong>${status}</strong>.</p>`,
    });
    if (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleApprove = async (id) => {
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .update({ status: 'approved', approved_by: supabase.auth.user().id })
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error approving voucher:', error);
    } else {
      console.log('Voucher approved successfully');
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', voucher.prepared_by)
        .single();
      if (user) {
        await sendEmailNotification(user.email, 'approved', voucher.voucher_number);
      }
      fetchPendingVouchers();
    }
  };

  const handleReject = async (id) => {
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .update({ status: 'rejected', approved_by: supabase.auth.user().id })
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error rejecting voucher:', error);
    } else {
      console.log('Voucher rejected successfully');
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', voucher.prepared_by)
        .single();
      if (user) {
        await sendEmailNotification(user.email, 'rejected', voucher.voucher_number);
      }
      fetchPendingVouchers();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Pending Vouchers</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Voucher Number</th>
            <th className="p-2 border">Payee</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingVouchers.map((voucher) => (
            <tr key={voucher.id} className="border">
              <td className="p-2 border">{voucher.voucher_number}</td>
              <td className="p-2 border">{voucher.payee}</td>
              <td className="p-2 border">{voucher.amount}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => handleApprove(voucher.id)}
                  className="p-1 bg-green-500 text-white rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(voucher.id)}
                  className="p-1 bg-red-500 text-white rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VoucherApproval;
