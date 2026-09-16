import { useEffect, useState } from "react";
import adminService from "../../services/adminService";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService.getUsers().then((response) => {
      setUsers(response.users || []);
      setMeta(response.meta);
    }).catch((err) => setError(err.response?.data?.message || "Unable to load users."));
  }, []);

  return <div className="page-container"><div className="page-panel p-5 sm:p-8"><div className="page-header"><div><p className="page-eyebrow">Administration</p><h1 className="page-title">User directory</h1><p className="page-subtitle">A backend-protected view for account management and support.</p></div></div>{error ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-950/50 text-slate-400"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead><tbody>{users.map((account) => <tr key={account.id} className="border-t border-white/10 text-slate-200"><td className="px-4 py-3">{account.name}</td><td className="px-4 py-3">{account.email}</td><td className="px-4 py-3 capitalize">{account.role}</td><td className="px-4 py-3">{account.isActive ? "Active" : "Inactive"}</td><td className="px-4 py-3">{new Date(account.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}{meta && <p className="mt-4 text-sm text-slate-500">{meta.total} total users</p>}</div></div>;
}

export default AdminUsers;
