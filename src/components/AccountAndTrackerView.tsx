import React, { useState } from 'react';
import {
  Check,
  Download,
  Heart,
  LogIn,
  LogOut,
  Package,
  Plus,
  Ruler,
  Scissors,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  BESPOKE_PIPELINE,
  formatMoney,
  inToCm,
  RTW_PIPELINE,
} from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { downloadOrderReceiptFromServer } from '../lib/api';
import { MeasurementProfile } from '../types/josy';
import { MeasurementDrawer } from './MeasurementDrawer';

type AccountTab = 'orders' | 'profiles' | 'wishlist';

export function AccountAndTrackerView() {
  const {
    user,
    isAdmin,
    openAuthModal,
    signInWithGoogle,
    signOutUser,
    orders,
    measurementProfiles,
    deleteMeasurementProfile,
    wishlistIds,
    products,
    currency,
    setSelectedProduct,
    toggleWishlist,
    settleBespokeBalance,
    toggleOrderWhatsapp,
    setActivePage,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MeasurementProfile | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header Band */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E4E4E0]">
        <div>
          <p className="text-xs text-[#71717A]">Josy Textile Client Hub</p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-medium text-[#111113] mt-1">
            {user ? `Welcome, ${user.displayName || 'Client'}` : 'My Account & Order Tracker'}
          </h1>
          <p className="text-sm text-[#52525B] mt-2">
            {user
              ? isAdmin
                ? `Signed in as ${user.email} · Verified Studio Administrator access.`
                : `Signed in as ${user.email} · Buyer Account (place orders, submit requests & track production).`
              : 'Create a buyer account with your email and password to place orders, submit studio requests, and track your commissions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActivePage('workshop')}
              className="px-4 py-2.5 border border-[#1B365D] text-[#1B365D] text-xs font-medium flex items-center gap-2 hover:bg-[#1B365D] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Open Tailor Workshop Portal</span>
            </button>
          )}

          {user ? (
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="px-4 py-2.5 border border-[#D4D4D8] text-[#27272A] text-xs font-medium flex items-center gap-2 hover:border-[#111113] transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="px-5 py-2.5 bg-[#111113] text-white text-xs font-medium flex items-center gap-2 hover:bg-[#1B365D] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Buyer Account</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="px-4 py-2.5 border border-[#111113] text-[#111113] text-xs font-medium flex items-center gap-2 hover:bg-[#111113] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Buyer Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="px-4 py-2.5 border border-[#D4D4D8] text-[#52525B] text-xs font-medium hover:border-[#111113] hover:text-[#111113] transition-colors whitespace-nowrap cursor-pointer"
              >
                Google / Admin
              </button>
            </>
          )}
        </div>
      </div>

      {/* Functional Segmented Tab Bar */}
      <div className="flex items-center gap-2 border-b border-[#E4E4E0] overflow-x-auto">
        {(
          [
            { id: 'orders', label: `Orders & Production Tracker (${orders.length})` },
            { id: 'profiles', label: `Saved Measurement Profiles (${measurementProfiles.length})` },
            { id: 'wishlist', label: `Wishlist (${wishlistProducts.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#111113] text-[#111113]'
                : 'border-transparent text-[#71717A] hover:text-[#111113]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Orders & Live RTW / Bespoke Pipeline Tracker */}
      {activeTab === 'orders' && (
        <div className="space-y-8">
          {orders.length === 0 ? (
            <div className="bg-white border border-[#E4E4E0] p-12 text-center space-y-3">
              <Package className="w-8 h-8 text-[#A1A1AA] mx-auto" />
              <p className="font-editorial text-2xl text-[#111113]">No orders yet</p>
              <p className="text-sm text-[#71717A]">
                Orders placed at checkout appear here with real-time RTW and Luxury production updates.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const rtwIndex = order.rtwStage ? RTW_PIPELINE.indexOf(order.rtwStage) : -1;
              const bespokeIndex = order.bespokeStage
                ? BESPOKE_PIPELINE.indexOf(order.bespokeStage)
                : -1;

              return (
                <article
                  key={order.id}
                  className="bg-white border border-[#E4E4E0] p-6 sm:p-8 space-y-6"
                >
                  {/* Order Top Meta */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E4E4E0]">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                        <span className="font-mono font-semibold text-[#111113]">{order.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>Placed {order.createdAt.slice(0, 10)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{order.shippingZone.label}</span>
                      </div>
                      <p className="text-xs text-[#52525B]">
                        {order.customerName} · {order.deliveryAddress}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs">
                      <div>
                        <p className="text-[#71717A]">Total Order</p>
                        <p className="font-mono font-semibold text-[#111113] tabular-nums">
                          {formatMoney(order.totalNGN, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#71717A]">
                          {order.amountPaidNGN === 0 && !order.balanceSettled
                            ? 'Payment Status'
                            : 'Paid'}
                        </p>
                        <p className="font-mono font-semibold text-[#1B365D] tabular-nums">
                          {order.amountPaidNGN === 0 && !order.balanceSettled
                            ? 'Pending Studio Confirmation'
                            : formatMoney(order.amountPaidNGN, currency)}
                        </p>
                      </div>
                      {!order.balanceSettled && order.balanceDueNGN > 0 && order.amountPaidNGN > 0 && (
                        <div>
                          <p className="text-[#71717A]">40% Balance Upon QC</p>
                          <p className="font-mono font-semibold text-[#B48436] tabular-nums">
                            {formatMoney(order.balanceDueNGN, currency)}
                          </p>
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={downloadingId === order.id}
                        onClick={async () => {
                          setDownloadingId(order.id);
                          const ok = await downloadOrderReceiptFromServer(order);
                          setDownloadingId(null);
                          showToast(
                            ok
                              ? `Downloaded official receipt for ${order.id}`
                              : 'Unable to generate receipt right now.'
                          );
                        }}
                        className="px-3 py-2 border border-[#D4D4D8] text-[#111113] text-[11px] font-medium flex items-center gap-1.5 hover:border-[#111113] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingId === order.id ? 'Generating...' : 'Download Receipt'}</span>
                      </button>
                    </div>
                  </div>

                  {/* RTW 4-Stage Pipeline */}
                  {order.rtwStage && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#111113]">
                          Ready-to-Wear Fulfillment Pipeline
                        </span>
                        {order.rtwTrackingCode && (
                          <span className="font-mono text-[#1B365D]">
                            Courier Tracking: {order.rtwTrackingCode}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {RTW_PIPELINE.map((stage, idx) => {
                          const done = idx <= rtwIndex;
                          return (
                            <div
                              key={stage}
                              className={`p-3 border text-xs ${
                                done
                                  ? 'border-[#111113] bg-[#111113] text-white'
                                  : 'border-[#E4E4E0] bg-[#FAFAFA] text-[#71717A]'
                              }`}
                            >
                              <p className="font-mono text-[10px] opacity-75">0{idx + 1}</p>
                              <p className="font-medium mt-0.5">{stage}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bespoke 6-Stage Pipeline */}
                  {order.bespokeStage && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#1B365D] flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-[#B48436]" />
                          <span>Luxury Tailoring Pipeline — Isoko Road Studio</span>
                        </span>
                        <span className="font-mono text-[#71717A]">
                          Target Completion: {order.targetCompletionDate}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {BESPOKE_PIPELINE.map((stage, idx) => {
                          const done = idx <= bespokeIndex;
                          return (
                            <div
                              key={stage}
                              className={`p-3 border text-xs ${
                                done
                                  ? 'border-[#1B365D] bg-[#1B365D] text-white'
                                  : 'border-[#E4E4E0] bg-[#FAFAFA] text-[#71717A]'
                              }`}
                            >
                              <p className="font-mono text-[10px] opacity-75">0{idx + 1}</p>
                              <p className="font-medium mt-0.5 leading-snug">{stage}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Automated 40% Balance Settlement Callout upon QC */}
                      {!order.balanceSettled &&
                        order.balanceDueNGN > 0 &&
                        order.bespokeStage === 'Finishing & Quality Check' && (
                          <div className="p-4 bg-[#F8FAFC] border border-[#1B365D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-[#1B365D]">
                                Quality Control Completed — Automated Balance Link Ready
                              </p>
                              <p className="text-xs text-[#52525B]">
                                Settle your remaining 40% balance (
                                <strong className="font-mono text-[#111113]">
                                  {formatMoney(order.balanceDueNGN, currency)}
                                </strong>
                                ) via Isoko Road studio concierge (07032802844 · josephwingie@gmail.com) to authorize dispatch.
                              </p>
                            </div>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => void settleBespokeBalance(order.id)}
                                className="px-5 py-2.5 bg-[#1B365D] text-white text-xs font-medium hover:bg-[#111113] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Confirm 40% Balance Settled
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Garment Line Items + Notification Log */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#E4E4E0]">
                    <div className="lg:col-span-6 space-y-2.5">
                      <p className="text-xs font-medium text-[#71717A]">Order Items</p>
                      {[...order.rtwItems, ...order.bespokeItems].map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-xs">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-14 object-cover bg-[#F2F2F0] shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#111113] truncate">{item.name}</p>
                            <p className="text-[#71717A]">
                              {item.selectedMode === 'BESPOKE'
                                ? `Custom Tailored · ${item.swatch.name}`
                                : `RTW Size ${item.size} · ${item.swatch.name}`}{' '}
                              · Qty {item.quantity}
                            </p>
                          </div>
                          <span className="font-mono tabular-nums text-[#111113]">
                            {formatMoney(item.unitPriceNGN * item.quantity, currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="lg:col-span-6 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-[#71717A]">
                          Automated Milestone Notifications
                        </p>
                        {isAdmin ? (
                          <label className="flex items-center gap-1.5 text-[11px] text-[#52525B] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={order.whatsappOptIn}
                              onChange={(e) => void toggleOrderWhatsapp(order.id, e.target.checked)}
                              className="accent-[#1B365D]"
                            />
                            <span>WhatsApp Alerts</span>
                          </label>
                        ) : (
                          <span className="text-[11px] font-mono text-[#71717A]">
                            WhatsApp Alerts: {order.whatsappOptIn ? 'Active' : 'Email Only'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {order.notifications.map((n, i) => (
                          <div key={i} className="text-xs border-b border-[#F4F4F5] pb-2">
                            <div className="flex items-center justify-between text-[11px] text-[#71717A] font-mono">
                              <span>{n.stage}</span>
                              <span>
                                {n.channel} · {n.timestamp}
                              </span>
                            </div>
                            <p className="text-[#3F3F46] mt-0.5">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Saved Measurement Profiles */}
      {activeTab === 'profiles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#52525B]">
              Store multiple named body measurement profiles for instant one-click luxury tailoring.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingProfile(null);
                setProfileDrawerOpen(true);
              }}
              className="px-4 py-2.5 bg-[#111113] text-white text-xs font-medium flex items-center gap-2 hover:bg-[#1B365D] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Measurement Profile</span>
            </button>
          </div>

          {measurementProfiles.length === 0 ? (
            <div className="bg-white border border-[#E4E4E0] p-12 text-center space-y-3">
              <Ruler className="w-8 h-8 text-[#A1A1AA] mx-auto" />
              <p className="font-editorial text-2xl text-[#111113]">No saved profiles yet</p>
              <p className="text-sm text-[#71717A]">
                Create your first profile (e.g., &ldquo;My Corporate Suit Fit&rdquo; or &ldquo;Traditional Agbada Fit&rdquo;) for effortless repeat custom orders.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {measurementProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white border border-[#E4E4E0] p-6 flex flex-col justify-between space-y-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-editorial text-2xl font-medium text-[#111113]">
                          {profile.name}
                        </h3>
                        <p className="text-xs text-[#71717A] mt-0.5">
                          Updated {profile.updatedAt} · Preferred Unit: {profile.unit.toUpperCase()}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => void deleteMeasurementProfile(profile.id)}
                          aria-label="Delete profile"
                          className="p-1.5 text-[#A1A1AA] hover:text-[#991B1B] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#F4F4F5] text-xs font-mono tabular-nums">
                      <div>
                        <p className="font-sans text-[11px] text-[#71717A]">Chest / Bust</p>
                        <p className="font-medium text-[#111113] mt-0.5">
                          {profile.measurements.chestBust}&quot; / {inToCm(profile.measurements.chestBust)}cm
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-[11px] text-[#71717A]">Waist</p>
                        <p className="font-medium text-[#111113] mt-0.5">
                          {profile.measurements.waist}&quot; / {inToCm(profile.measurements.waist)}cm
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-[11px] text-[#71717A]">Shoulder</p>
                        <p className="font-medium text-[#111113] mt-0.5">
                          {profile.measurements.shoulderWidth}&quot; / {inToCm(profile.measurements.shoulderWidth)}cm
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-[11px] text-[#71717A]">Sleeve</p>
                        <p className="font-medium text-[#111113] mt-0.5">
                          {profile.measurements.sleeveLength}&quot;
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-[11px] text-[#71717A]">Inseam</p>
                        <p className="font-medium text-[#111113] mt-0.5">
                          {profile.measurements.trouserInseam}&quot;
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-[11px] text-[#71717A]">Length</p>
                        <p className="font-medium text-[#111113] mt-0.5">
                          {profile.measurements.garmentLength}&quot;
                        </p>
                      </div>
                    </div>

                    {profile.notes && (
                      <p className="text-xs text-[#52525B] mt-4 pt-3 border-t border-[#F4F4F5]">
                        {profile.notes}
                      </p>
                    )}
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProfile(profile);
                        setProfileDrawerOpen(true);
                      }}
                      className="w-full py-2.5 border border-[#111113] text-xs font-medium text-[#111113] hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
                    >
                      Edit Body Metrics
                    </button>
                  ) : (
                    <p className="text-[11px] text-[#71717A] pt-3 border-t border-[#F4F4F5]">
                      Locked to atelier file · Create a new profile for updated measurements or contact Studio Admin.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistProducts.length === 0 ? (
            <div className="bg-white border border-[#E4E4E0] p-12 text-center space-y-3">
              <Heart className="w-8 h-8 text-[#A1A1AA] mx-auto" />
              <p className="font-editorial text-2xl text-[#111113]">No saved pieces yet</p>
              <p className="text-sm text-[#71717A]">
                Tap the heart icon on any Josy Textile garment to curate your wardrobe wishlist.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistProducts.map((product) => (
                <div key={product.id} className="bg-white border border-[#E4E4E0] flex flex-col">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="aspect-[3/4] bg-[#F2F2F0] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-103 transition-transform duration-300"
                    />
                  </button>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-xs text-[#71717A]">
                        {product.categoryCode} · {product.categoryName}
                      </p>
                      <h3 className="text-sm font-semibold text-[#111113] mt-1">{product.name}</h3>
                      <p className="font-mono text-sm text-[#111113] tabular-nums mt-1">
                        {formatMoney(product.priceNGN, currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 py-2 bg-[#111113] text-white text-xs font-medium hover:bg-[#1B365D] transition-colors cursor-pointer"
                      >
                        Select Fit & Buy
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleWishlist(product.id)}
                        aria-label="Remove from wishlist"
                        className="p-2 border border-[#D4D4D8] text-[#52525B] hover:text-[#991B1B] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Measurement Profile Editor Drawer */}
      <MeasurementDrawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        title={editingProfile ? `Edit "${editingProfile.name}"` : 'Create Saved Measurement Profile'}
        submitLabel="Save Profile"
        initialProfile={editingProfile}
        defaultSaveProfile={true}
        onConfirm={() => {
          setProfileDrawerOpen(false);
        }}
      />
    </div>
  );
}
