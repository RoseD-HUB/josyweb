import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CloudUpload,
  Lock,
  Plus,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import {
  BESPOKE_PIPELINE,
  CATEGORIES,
  formatMoney,
  IMG_BOMBER,
  IMG_SENATOR,
  RTW_PIPELINE,
  SIZES,
} from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { CategoryCode, FulfillmentMode, Order, SizeCode } from '../types/josy';
import { TailorJobCardPrintModal } from './TailorJobCardPrintModal';

type WorkshopTab = 'dashboard' | 'queue' | 'catalog';

export function WorkshopAdminPortal() {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    products,
    orders,
    settings,
    currency,
    advanceOrderStage,
    updateProductStock,
    createProduct,
    updateStoreSettings,
    seedInitialCatalogToCloud,
    setActivePage,
  } = useStore();

  const [tab, setTab] = useState<WorkshopTab>('dashboard');
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryCode>('05');
  const [newMode, setNewMode] = useState<FulfillmentMode>('HYBRID');
  const [newPrice, setNewPrice] = useState(125000);
  const [newDescription, setNewDescription] = useState('');

  // Real-time Sales & Operations KPIs
  const metrics = useMemo(() => {
    let rtwRevenue = 0;
    let bespokeRevenue = 0;
    let pendingBespokeBalances = 0;
    let activeBespokeJobs = 0;

    orders.forEach((o) => {
      o.rtwItems.forEach((i) => {
        rtwRevenue += i.unitPriceNGN * i.quantity;
      });
      o.bespokeItems.forEach((i) => {
        bespokeRevenue += i.unitPriceNGN * i.quantity;
      });
      if (!o.balanceSettled) {
        pendingBespokeBalances += o.balanceDueNGN;
      }
      if (o.bespokeStage && o.bespokeStage !== 'Delivered') {
        activeBespokeJobs += 1;
      }
    });

    const lowStockAlerts: Array<{ productName: string; sku: string; size: SizeCode; count: number }> = [];
    products.forEach((p) => {
      if (p.fulfillmentMode === 'BESPOKE_ONLY' || p.soldOutOverride) return;
      SIZES.forEach((s) => {
        const count = p.stockBySize[s] || 0;
        if (count > 0 && count <= 3) {
          lowStockAlerts.push({ productName: p.name, sku: p.sku, size: s, count });
        }
      });
    });

    return {
      rtwRevenue,
      bespokeRevenue,
      pendingBespokeBalances,
      activeBespokeJobs,
      lowStockAlerts,
    };
  }, [orders, products]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = CATEGORIES.find((c) => c.code === newCategory) || CATEGORIES[0];
    await createProduct({
      sku: newSku.trim().toUpperCase() || `JT-${newCategory}-${Date.now().toString().slice(-3)}`,
      name: newName.trim(),
      categoryCode: newCategory,
      categoryName: cat.name,
      fulfillmentMode: newMode,
      priceNGN: Number(newPrice) || 85000,
      bespokeSurchargeNGN: newMode === 'HYBRID' ? 20000 : 0,
      image: cat.image || IMG_SENATOR,
      secondaryImage: IMG_BOMBER,
      description:
        newDescription.trim() ||
        'Handcrafted at our Isoko Road, Ughelli atelier using authentic West African textiles.',
      craftDetails: [
        'Cut and finished at Josy Textile Isoko Road Studio',
        'Authentic curated fabric swatch selection',
      ],
      swatches: [
        {
          id: `sw-${Date.now()}`,
          name: 'Signature Indigo Textile',
          material: 'Authentic African Weave',
          hexPrimary: '#1B365D',
          hexSecondary: '#B48436',
          hexAccent: '#111113',
          patternType: 'ankara',
        },
      ],
      cutOptions: ['Classic Tailored Cut', 'Relaxed Contemporary Cut'],
      stockBySize:
        newMode === 'BESPOKE_ONLY'
          ? { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 }
          : { S: 5, M: 6, L: 6, XL: 4, '2XL': 3, '3XL': 2 },
      modelNote: 'Handcrafted in Ughelli, Delta State.',
      isNewArrival: true,
      filterGroups: ['All', cat.defaultFilterGroup],
    });
    setNewName('');
    setNewSku('');
    setNewDescription('');
    setShowNewForm(false);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white border border-[#E4E4E0] p-10 text-center space-y-5">
          <div className="w-12 h-12 mx-auto bg-[#F4F4F5] border border-[#E4E4E0] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#1B365D]" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-[#71717A] tracking-[0.18em] uppercase">
              Restricted Atelier Operations
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111113]">
              Studio Administrator Access Required
            </h1>
            <p className="text-sm text-[#52525B] max-w-lg mx-auto leading-relaxed">
              Buyer accounts can place orders, submit tailoring requests, and track fulfillment, but cannot edit or delete platform records, inventory, or production stages.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="px-6 py-3 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors cursor-pointer"
            >
              Sign In with Studio Admin Google Account
            </button>
            <button
              type="button"
              onClick={() => setActivePage('home')}
              className="px-6 py-3 border border-[#D4D4D8] text-[#27272A] text-xs font-medium tracking-wider uppercase hover:border-[#111113] transition-colors cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E4E4E0]">
        <div>
          <p className="text-xs text-[#71717A]">
            Isoko Road Headquarters · Ughelli, Delta State
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111113] mt-1">
            Admin & Tailor Workshop Portal
          </h1>
          <p className="text-sm text-[#52525B] mt-2">
            Manage 9-category S–3XL stock levels, advance RTW & Luxury pipelines, toggle peak-season tailoring capacity, and print Tailor Job Cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <>
              <span className="text-xs font-mono text-[#1B365D] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Admin ({user?.email})</span>
              </span>
              <button
                type="button"
                onClick={() => void seedInitialCatalogToCloud()}
                className="px-4 py-2.5 bg-[#1B365D] text-white text-xs font-medium flex items-center gap-2 hover:bg-[#111113] transition-colors cursor-pointer"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Sync Catalog to Firestore</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="px-4 py-2.5 bg-[#111113] text-white text-xs font-medium hover:bg-[#1B365D] transition-colors cursor-pointer"
            >
              Sign In as Studio Admin for Cloud Persistence
            </button>
          )}
        </div>
      </div>

      {/* Workshop Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E4E0] overflow-x-auto">
        {(
          [
            { id: 'dashboard', label: 'Sales & Operations Dashboard' },
            { id: 'queue', label: `Production Queue & Job Cards (${orders.length})` },
            { id: 'catalog', label: `Catalog & S–3XL Inventory (${products.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === t.id
                ? 'border-[#111113] text-[#111113]'
                : 'border-transparent text-[#71717A] hover:text-[#111113]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Sales & Operations Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-8">
          {/* 4-Column Tabular KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-[#E4E4E0] p-6">
              <p className="text-xs text-[#71717A]">Ready-to-Wear Revenue</p>
              <p className="font-mono text-2xl font-medium text-[#111113] tabular-nums mt-2">
                {formatMoney(metrics.rtwRevenue, currency)}
              </p>
              <p className="text-xs text-[#52525B] mt-1">Immediate 24–48 hr dispatch</p>
            </div>
            <div className="bg-white border border-[#E4E4E0] p-6">
              <p className="text-xs text-[#71717A]">Luxury Tailoring Revenue</p>
              <p className="font-mono text-2xl font-medium text-[#1B365D] tabular-nums mt-2">
                {formatMoney(metrics.bespokeRevenue, currency)}
              </p>
              <p className="text-xs text-[#52525B] mt-1">
                {metrics.activeBespokeJobs} active custom job{metrics.activeBespokeJobs === 1 ? '' : 's'}
              </p>
            </div>
            <div className="bg-white border border-[#E4E4E0] p-6">
              <p className="text-xs text-[#71717A]">Pending 40% Luxury Balances</p>
              <p className="font-mono text-2xl font-medium text-[#B48436] tabular-nums mt-2">
                {formatMoney(metrics.pendingBespokeBalances, currency)}
              </p>
              <p className="text-xs text-[#52525B] mt-1">Collectible upon QC completion</p>
            </div>
            <div className="bg-white border border-[#E4E4E0] p-6">
              <p className="text-xs text-[#71717A]">Average Fulfillment Turnaround</p>
              <p className="font-mono text-2xl font-medium text-[#111113] tabular-nums mt-2">
                11.4 days
              </p>
              <p className="text-xs text-[#52525B] mt-1">Target window: {settings.bespokeLeadWindow}</p>
            </div>
          </div>

          {/* Atelier Capacity & Payment Policy Toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E4E4E0] p-6 space-y-5">
              <h2 className="font-editorial text-2xl font-medium text-[#111113]">
                Peak Season & Payment Controls
              </h2>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#F4F4F5]">
                <div>
                  <p className="text-sm font-medium text-[#111113]">Luxury Order Capacity</p>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Pause new custom tailoring commissions during festive peaks (Christmas, Easter, Owambe rush).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void updateStoreSettings({
                      bespokeCapacityOpen: !settings.bespokeCapacityOpen,
                    })
                  }
                  className={`px-4 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    settings.bespokeCapacityOpen
                      ? 'bg-[#1B365D] text-white'
                      : 'bg-[#F4F4F5] text-[#52525B] border border-[#D4D4D8]'
                  }`}
                >
                  {settings.bespokeCapacityOpen ? 'Accepting Custom Orders' : 'Paused (Peak Waitlist)'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#111113]">
                    60% / 40% Split Deposit Option
                  </p>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Allow luxury buyers to pay 60% upfront and 40% automatically upon Quality Control completion.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void updateStoreSettings({
                      splitDepositEnabled: !settings.splitDepositEnabled,
                    })
                  }
                  className={`px-4 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    settings.splitDepositEnabled
                      ? 'bg-[#111113] text-white'
                      : 'bg-[#F4F4F5] text-[#52525B] border border-[#D4D4D8]'
                  }`}
                >
                  {settings.splitDepositEnabled ? 'Enabled (60/40)' : 'Disabled (100% Only)'}
                </button>
              </div>
            </div>

            {/* Low-Stock Alerts */}
            <div className="bg-white border border-[#E4E4E0] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-editorial text-2xl font-medium text-[#111113]">
                  S–3XL Low-Stock Alerts
                </h2>
                <span className="font-mono text-xs text-[#71717A] tabular-nums">
                  {metrics.lowStockAlerts.length} alert{metrics.lowStockAlerts.length === 1 ? '' : 's'}
                </span>
              </div>
              {metrics.lowStockAlerts.length === 0 ? (
                <p className="text-xs text-[#52525B]">All RTW sizes are comfortably stocked.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-[#F4F4F5] text-xs">
                  {metrics.lowStockAlerts.map((alert, idx) => (
                    <div
                      key={`${alert.sku}-${alert.size}-${idx}`}
                      className="py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#B48436] shrink-0" />
                        <span className="truncate font-medium text-[#111113]">
                          {alert.productName}
                        </span>
                      </div>
                      <span className="font-mono text-[#991B1B] whitespace-nowrap shrink-0 tabular-nums">
                        Size {alert.size} · {alert.count} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Production Queue & Printable Tailor Job Cards */}
      {tab === 'queue' && (
        <div className="space-y-4">
          {orders.map((order) => {
            const canAdvanceRtw =
              order.rtwStage && RTW_PIPELINE.indexOf(order.rtwStage) < RTW_PIPELINE.length - 1;
            const canAdvanceBespoke =
              order.bespokeStage &&
              BESPOKE_PIPELINE.indexOf(order.bespokeStage) < BESPOKE_PIPELINE.length - 1;

            return (
              <div
                key={order.id}
                className="bg-white border border-[#E4E4E0] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                    <span className="font-mono font-semibold text-[#111113]">{order.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{order.customerName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{order.shippingZone.coverage}</span>
                  </div>
                  <p className="text-xs text-[#52525B]">
                    {order.bespokeItems.length > 0 && (
                      <span>
                        Luxury Stage: <strong className="text-[#1B365D]">{order.bespokeStage}</strong>
                      </span>
                    )}
                    {order.bespokeItems.length > 0 && order.rtwItems.length > 0 && ' · '}
                    {order.rtwItems.length > 0 && (
                      <span>
                        RTW Stage: <strong className="text-[#111113]">{order.rtwStage}</strong>
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-mono text-[#71717A] tabular-nums">
                    Paid {formatMoney(order.amountPaidNGN, currency)} / Total{' '}
                    {formatMoney(order.totalNGN, currency)}
                    {!order.balanceSettled && ' · 40% Balance Pending'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {order.bespokeItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrintOrder(order)}
                      className="px-4 py-2.5 border border-[#111113] text-xs font-medium text-[#111113] flex items-center gap-2 hover:bg-[#111113] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Tailor Job Card (Print/PDF)</span>
                    </button>
                  )}

                  {canAdvanceBespoke && (
                    <button
                      type="button"
                      onClick={() => void advanceOrderStage(order.id, 'BESPOKE')}
                      className="px-4 py-2.5 bg-[#1B365D] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#111113] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>Advance Luxury Stage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {canAdvanceRtw && (
                    <button
                      type="button"
                      onClick={() => void advanceOrderStage(order.id, 'RTW')}
                      className="px-4 py-2.5 bg-[#111113] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#27272A] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>Advance RTW Stage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Catalog & S-3XL Inventory Manager */}
      {tab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#52525B]">
              Adjust live S–3XL stock counts or publish new garments across all 9 Josy Textile categories.
            </p>
            <button
              type="button"
              onClick={() => setShowNewForm((v) => !v)}
              className="px-4 py-2.5 bg-[#111113] text-white text-xs font-medium flex items-center gap-2 hover:bg-[#1B365D] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNewForm ? 'Close Form' : 'Add New Garment'}</span>
            </button>
          </div>

          {showNewForm && (
            <form
              onSubmit={handleCreateProduct}
              className="bg-white border border-[#E4E4E0] p-6 space-y-4"
            >
              <h3 className="font-editorial text-2xl text-[#111113]">
                Create New Catalog Garment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Garment Title"
                  className="border border-[#D4D4D8] px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="SKU (e.g., JT-05-KFT09)"
                  className="border border-[#D4D4D8] px-3 py-2 text-sm font-mono"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CategoryCode)}
                  className="border border-[#D4D4D8] px-3 py-2 text-sm bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value as FulfillmentMode)}
                  className="border border-[#D4D4D8] px-3 py-2 text-sm bg-white"
                >
                  <option value="HYBRID">HYBRID (RTW + Custom Fit)</option>
                  <option value="RTW_ONLY">RTW_ONLY (Standard S–3XL)</option>
                  <option value="BESPOKE_ONLY">LUXURY_ONLY (Made to Measure)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="number"
                  required
                  min={5000}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  placeholder="Base Price (NGN)"
                  className="border border-[#D4D4D8] px-3 py-2 text-sm font-mono"
                />
                <input
                  type="text"
                  maxLength={600}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Fabric provenance & tailoring description"
                  className="sm:col-span-2 border border-[#D4D4D8] px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1B365D] text-white text-xs font-medium hover:bg-[#111113] transition-colors cursor-pointer"
              >
                Publish Garment
              </button>
            </form>
          )}

          {/* Inventory Matrix Table */}
          <div className="bg-white border border-[#E4E4E0] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4E4E0] bg-[#FAFAFA] text-[#71717A]">
                  <th className="p-4 font-medium">Garment / SKU</th>
                  <th className="p-4 font-medium">Mode</th>
                  <th className="p-4 font-medium">Base Price</th>
                  {SIZES.map((s) => (
                    <th key={s} className="p-3 font-mono text-center">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-4 min-w-[240px]">
                      <p className="font-medium text-[#111113]">{p.name}</p>
                      <p className="font-mono text-[11px] text-[#71717A] mt-0.5">
                        {p.categoryCode} · {p.sku}
                      </p>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-[#52525B]">
                      {p.fulfillmentMode === 'BESPOKE_ONLY' ? 'LUXURY_ONLY' : p.fulfillmentMode}
                    </td>
                    <td className="p-4 font-mono tabular-nums text-[#111113]">
                      {formatMoney(p.priceNGN, currency)}
                    </td>
                    {SIZES.map((s) => (
                      <td key={s} className="p-2 text-center">
                        {p.fulfillmentMode === 'BESPOKE_ONLY' ? (
                          <span className="text-[#A1A1AA] font-mono">—</span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={999}
                            value={p.stockBySize[s] || 0}
                            onChange={(e) =>
                              void updateProductStock(p.id, s, Number(e.target.value))
                            }
                            aria-label={`${p.name} size ${s} stock`}
                            className={`w-14 text-center font-mono tabular-nums py-1.5 border text-xs focus:outline-none focus:border-[#111113] ${
                              (p.stockBySize[s] || 0) <= 3
                                ? 'border-[#B48436] bg-[#FFFBEB] text-[#92400E]'
                                : 'border-[#E4E4E0] bg-white text-[#111113]'
                            }`}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Tailor Job Card Modal */}
      <TailorJobCardPrintModal order={printOrder} onClose={() => setPrintOrder(null)} />
    </div>
  );
}
