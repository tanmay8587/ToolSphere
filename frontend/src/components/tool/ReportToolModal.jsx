import { useState } from 'react';
import { FiX, FiFlag } from 'react-icons/fi';
import { reportTool } from '../../services/toolsService';
import { useToast } from '../common/Toast';

const REPORT_REASONS = [
  { value: 'Broken Link', label: 'Broken Link' },
  { value: 'Incorrect Information', label: 'Incorrect Information' },
  { value: 'Duplicate Tool', label: 'Duplicate Tool' },
  { value: 'Spam', label: 'Spam' },
  { value: 'Other', label: 'Other' },
];

export default function ReportToolModal({ isOpen, onClose, tool }) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();

  if (!isOpen || !tool) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!reason) {
      setError('Please select a reason for reporting.');
      return;
    }

    try {
      setLoading(true);
      const data = await reportTool(tool._id, tool.name, reason, comment);

      if (data.success) {
        setSuccess(true);
        addToast('Report submitted successfully. Thank you for helping us improve.', 'success');
        
        // Close modal after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setComment('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:text-white disabled:opacity-50"
        >
          <FiX size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-red-500/10 p-2">
              <FiFlag className="text-red-400" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Report Tool</h2>
          </div>
          <p className="text-sm text-slate-400">
            Help us improve by reporting issues with <span className="text-cyan-400 font-medium">{tool.name}</span>
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm text-green-300">
              Report submitted successfully. Thank you for helping us improve!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Reason <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                      reason === option.value
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-white/10 bg-slate-950/50 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-4 w-4 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-slate-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comment Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Comment <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Provide additional details..."
                maxLength={1000}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none"
              />
              <p className="mt-1 text-xs text-slate-500 text-right">
                {comment.length}/1000
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}