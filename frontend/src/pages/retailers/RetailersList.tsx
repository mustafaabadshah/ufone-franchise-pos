import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, Search, Store, Phone, MapPin, DollarSign, ArrowUpRight, ArrowDownLeft, RefreshCw, FileText } from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import Modal from '../../components/common/Modal';
import ExportPrintButtons from '../../components/common/ExportPrintButtons';
import { useAuth } from '../../context/AuthContext';

export default function RetailersList() {
  const { user } = useAuth();
  const isViewer = user?.role?.toLowerCase() === 'viewer';
  const [retailers, setRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<any>({ total_retailers: 0, total_credit_balance: 0, total_collected: 0 });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    shop_name: '',
    phone: '',
    address: '',
    credit_limit: 50000,
    current_balance: 0,
  });

  const [collectionForm, setCollectionForm] = useState({
    retailer_id: 0,
    amount_collected: 0,
    payment_method: 'Cash',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [retailerData, summaryData] = await Promise.all([
        api.getRetailers(search),
        api.getRetailerCollectionsSummary().catch(() => ({})),
      ]);
      setRetailers(retailerData);
      
      const totalBalance = retailerData.reduce((acc: number, r: any) => acc + Number(r.current_balance || 0), 0);
      setSummary({
        total_retailers: retailerData.length,
        total_credit_balance: totalBalance,
        total_collected: summaryData?.total_collected || 0,
      });
    } catch (err: any) {
      console.error('Failed to load retailers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRetailer(createForm);
      setShowCreateModal(false);
      setCreateForm({ name: '', shop_name: '', phone: '', address: '', credit_limit: 50000, current_balance: 0 });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating retailer');
    }
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRetailerCollection(collectionForm);
      setShowCollectionModal(false);
      setCollectionForm({ retailer_id: 0, amount_collected: 0, payment_method: 'Cash', notes: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error recording collection');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Retailer Network</h1>
          <p className="text-sm text-slate-500 mt-1">Manage partner retail shops, credit balances, and cash collections</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPrintButtons reportType="retailers" title="Retailers Directory" targetId="retailers-table" />
          {!isViewer && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Retailer
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Total Retailers"
          value={summary.total_retailers}
          icon={Store}
          color="indigo"
          subtitle="Active retail distribution shops"
        />
        <MetricCard
          title="Total Outstanding Credit"
          value={`Rs. ${Number(summary.total_credit_balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={ArrowUpRight}
          color="amber"
          subtitle="Pending receivables from network"
        />
        <MetricCard
          title="Collections This Month"
          value={`Rs. ${Number(summary.total_collected).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
          icon={ArrowDownLeft}
          color="emerald"
          subtitle="Cash & bank recoveries"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search retailer name, shop or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" id="retailers-table">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">S.No</th>
                <th className="py-3 px-4">Retailer & Shop</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Address / Area</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading retailers...</td>
                </tr>
              ) : retailers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No retailers found matching criteria.</td>
                </tr>
              ) : (
                retailers.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{r.shop_name || r.name}</div>
                      <div className="text-xs text-slate-500">Proprietor: {r.name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {r.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-xs">{r.address || 'Local Market'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      Rs. {Number(r.credit_limit || 0).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        Number(r.current_balance) > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Rs. {Number(r.current_balance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!isViewer ? (
                        <button
                          onClick={() => {
                            setSelectedRetailer(r);
                            setCollectionForm(prev => ({ ...prev, retailer_id: r.id }));
                            setShowCollectionModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-md transition-colors"
                        >
                          <DollarSign className="w-3 h-3" />
                          Collect Cash
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider font-extrabold text-slate-800">
                  Total Market Debtors ({retailers.length} Retailers):
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm whitespace-nowrap">
                  Rs. {retailers.reduce((acc, r) => acc + Number(r.credit_limit || 0), 0).toLocaleString('en-PK')}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-amber-800 text-sm whitespace-nowrap">
                  Rs. {retailers.reduce((acc, r) => acc + Number(r.current_balance || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-center text-slate-500 font-normal">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Add Retailer */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Register New Retailer">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Shop Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Madina Telecom"
              value={createForm.shop_name}
              onChange={(e) => setCreateForm({ ...createForm, shop_name: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Owner / Contact Person <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tariq Mehmood"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="03331234567"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Credit Limit (PKR)
              </label>
              <input
                type="number"
                value={createForm.credit_limit}
                onChange={(e) => setCreateForm({ ...createForm, credit_limit: Number(e.target.value) })}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Shop Address / Location
            </label>
            <textarea
              rows={2}
              placeholder="Shop # 12, Main Bazar, G-9 Markaz, Islamabad"
              value={createForm.address}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Create Retailer
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Collect Cash */}
      <Modal isOpen={showCollectionModal} onClose={() => setShowCollectionModal(false)} title={`Collect Cash - ${selectedRetailer?.shop_name || 'Retailer'}`}>
        <form onSubmit={handleCollectionSubmit} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-2">
            <div className="text-xs text-slate-500">Current Outstanding Balance:</div>
            <div className="text-lg font-bold font-mono text-amber-600">
              Rs. {Number(selectedRetailer?.current_balance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Amount Collected (PKR) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              max={Number(selectedRetailer?.current_balance || 9999999)}
              value={collectionForm.amount_collected || ''}
              onChange={(e) => setCollectionForm({ ...collectionForm, amount_collected: Number(e.target.value) })}
              className="w-full text-base font-mono font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={collectionForm.payment_method}
              onChange={(e) => setCollectionForm({ ...collectionForm, payment_method: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Receipt / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cleared invoice #829 via RSO recovery"
              value={collectionForm.notes}
              onChange={(e) => setCollectionForm({ ...collectionForm, notes: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCollectionModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Post Cash Collection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
