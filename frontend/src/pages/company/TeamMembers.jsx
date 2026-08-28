import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiUserPlus,
  FiLoader,
  FiTrash2,
  FiUsers,
  FiShield,
} from "react-icons/fi";
import {
  getTeamMembers,
  inviteTeamMember,
  updateTeamMember,
  removeTeamMember,
} from "../../services/companyApi";
import { useToast, ToastContainer } from "../../components/common/Toast";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 transition-colors duration-300 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

const roleColors = {
  owner: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  admin: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  editor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  viewer: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

export default function TeamMembers() {
  const { toasts, addToast, removeToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // invite form
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: "", name: "", role: "editor" });
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTeamMembers();
      if (res.data?.success) setData(res.data.data);
      else setError(res.data?.message || "Unable to load team members.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError("");
    try {
      const res = await inviteTeamMember(invite);
      if (res.data?.success) {
        addToast(res.data.message || "Team member added.", "success");
        setInvite({ email: "", name: "", role: "editor" });
        setShowInvite(false);
        load();
      } else {
        addToast(res.data?.message || "Failed to add team member.", "error");
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to add team member.", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const res = await updateTeamMember(id, { role });
      if (res.data?.success) {
        addToast("Team member role updated.", "success");
        load();
      } else {
        addToast(res.data?.message || "Failed to update role.", "error");
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update role.", "error");
    }
  };

  const handleRemove = async (id, email) => {
    if (!window.confirm(`Remove ${email} from your team?`)) return;
    try {
      const res = await removeTeamMember(id);
      if (res.data?.success) {
        addToast(res.data.message || "Team member removed.", "success");
        load();
      } else {
        addToast(res.data?.message || "Failed to remove team member.", "error");
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to remove team member.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <FiLoader className="mr-2 h-5 w-5 animate-spin" /> Loading team...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <FiUsers className="mx-auto mb-4 h-10 w-10 text-amber-400" />
        <h1 className="text-xl font-semibold text-white">No team available</h1>
        <p className="mt-2 text-sm text-slate-400">
          {error || "Team management is available once your company exists."}
        </p>
      </div>
    );
  }

  const { owner, members = [], isOwner } = data;

  const MemberRow = ({ member, showActions }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800">
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
          ) : (
            <FiUserPlus className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{member.name || member.email}</p>
          <p className="truncate text-xs text-slate-500">{member.email}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {member.isOwner ? (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleColors.owner}`}>
            <FiShield className="h-3 w-3" /> Owner
          </span>
        ) : (
          <select
            value={member.role}
            disabled={!showActions}
            onChange={(e) => handleRoleChange(member._id, e.target.value)}
            className="cursor-pointer rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-400/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {["admin", "editor", "viewer"].map((r) => (
              <option key={r} value={r}>
                {r[0].toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        )}

        {member.status && member.status !== "active" && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
            {member.status}
          </span>
        )}

        {showActions && (
          <button
            onClick={() => handleRemove(member._id, member.email)}
            className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
            aria-label={`Remove ${member.email}`}
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Team</h1>
          <p className="mt-2 text-slate-400">
            Manage the people who help look after your company's tools.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
          >
            <FiUserPlus className="h-4 w-4" /> {showInvite ? "Cancel" : "Invite member"}
          </button>
        )}
      </header>

      {showInvite && isOwner && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleInvite}
          className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Invite a team member</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                required
                value={invite.email}
                onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
                placeholder="teammate@company.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
              <input
                value={invite.name}
                onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Role</label>
              <select
                value={invite.role}
                onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))}
                className={`${inputClass} cursor-pointer`}
              >
                {["admin", "editor", "viewer"].map((r) => (
                  <option key={r} value={r}>
                    {r[0].toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inviting ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" /> Inviting...
                </>
              ) : (
                <>
                  <FiUserPlus className="h-4 w-4" /> Send invite
                </>
              )}
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-3">
        {owner && <MemberRow member={owner} showActions={false} />}
        {members.map((member) => (
          <MemberRow key={member._id} member={member} showActions={isOwner} />
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {isOwner
          ? "You can change member roles and remove members. Members with admin or editor roles can update your tools."
          : "Only the company owner can modify team members."}
      </p>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </motion.div>
  );
}