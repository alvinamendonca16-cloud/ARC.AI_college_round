import { useState } from 'react';
import { usePatchwork } from '@/context/PatchworkContext';
import { elementRegistry, getElementEntry } from '@/lib/sampleData';
import { readableTextColor } from '@/lib/colors';
import type { PatchTarget, PatchProperty } from '@/types';
import { ShoppingCart, Search, Menu, Bell, Star, Truck, Shield, Headphones } from 'lucide-react';

export function SampleWebsite({ onSelectElement }: { onSelectElement?: (elementId: string) => void }) {
  const { websiteState } = usePatchwork();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const renderSelectable = (
    elementId: string,
    children: React.ReactNode,
    wrapperClass = '',
  ) => {
    const entry = getElementEntry(elementId);
    if (!entry) return <>{children}</>;
    const isHovered = hoveredId === elementId;
    return (
      <span
        className={`relative inline-block cursor-pointer transition-all duration-150 rounded ${isHovered ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-white' : 'ring-1 ring-transparent hover:ring-1 hover:ring-cyan-300/50'} ${wrapperClass}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement?.(elementId);
        }}
        onMouseEnter={() => setHoveredId(elementId)}
        onMouseLeave={() => setHoveredId(null)}
        title={`Click to patch: ${entry.label}`}
      >
        {children}
        {isHovered && (
          <span className="absolute -top-6 left-0 text-[10px] font-bold bg-cyan-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
            {entry.label}
          </span>
        )}
      </span>
    );
  };

  const buyText = readableTextColor(websiteState.buyButtonBgColor);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden" onClick={() => setHoveredId(null)}>
      {/* Banner */}
      <div
        className="px-4 py-2 text-center text-sm font-medium"
        style={{
          backgroundColor: websiteState.bannerBgColor,
          color: readableTextColor(websiteState.bannerBgColor),
        }}
      >
        {renderSelectable('banner', websiteState.bannerText)}
      </div>

      {/* Nav Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900 text-lg">ShopDemo</span>
        </div>
        <div className="hidden md:flex items-center gap-5 text-sm text-gray-600">
          {websiteState.navLinks.map((link) => (
            <span key={link} className="hover:text-blue-600 cursor-pointer transition-colors">
              {link}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-500 cursor-pointer" />
          <Bell className="w-4 h-4 text-gray-500 cursor-pointer" />
          <Menu className="w-5 h-5 text-gray-500 cursor-pointer md:hidden" />
        </div>
      </div>

      {/* Product Section */}
      <div className="px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
          {/* Product Image Placeholder */}
          <div className="md:w-1/2">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <Headphones className="w-24 h-24 text-gray-400" strokeWidth={1.2} />
            </div>
            <div className="flex gap-2 mt-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                >
                  <Headphones className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 space-y-4">
            <div>
              {renderSelectable(
                'product-heading',
                <h1 className="text-2xl font-bold text-gray-900">{websiteState.productHeading}</h1>,
              )}
            </div>

            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="text-sm text-gray-500 ml-1">(124 reviews)</span>
            </div>

            <div>
              {renderSelectable(
                'product-price',
                <p className="text-2xl font-bold text-gray-900">{websiteState.productPrice}</p>,
              )}
            </div>

            <div>
              {renderSelectable(
                'product-description',
                <p className="text-sm text-gray-600 leading-relaxed">{websiteState.productDescription}</p>,
                'block',
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              {renderSelectable(
                'buy-button',
                <button
                  className="px-8 py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-md"
                  style={{
                    backgroundColor: websiteState.buyButtonBgColor,
                    color: websiteState.buyButtonTextColor,
                  }}
                >
                  {websiteState.buyButtonLabel}
                </button>,
              )}
              <button className="px-6 py-3 rounded-lg font-bold text-sm text-gray-700 border-2 border-gray-300 hover:border-gray-400 transition-all">
                Save for Later
              </button>
            </div>

            <div className="flex items-center gap-4 pt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                Free Shipping
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                2-Year Warranty
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        {renderSelectable(
          'footer-text',
          <p className="text-xs text-gray-500 text-center">{websiteState.footerText}</p>,
          'block w-full',
        )}
      </div>
    </div>
  );
}

// Helper to get current value of an element+property from state
export function getCurrentValue(
  state: import('@/types').WebsiteState,
  elementId: string,
  property: PatchProperty,
): string {
  const entry = getElementEntry(elementId);
  if (!entry) return '';
  switch (property) {
    case 'text':
    case 'label':
      return entry.readValue(state);
    case 'bgColor':
      if (elementId === 'buy-button') return state.buyButtonBgColor;
      if (elementId === 'banner') return state.bannerBgColor;
      return '';
    case 'textColor':
      if (elementId === 'buy-button') return state.buyButtonTextColor;
      return '';
    default:
      return '';
  }
}

export function buildPatchTarget(elementId: string): PatchTarget | null {
  const entry = getElementEntry(elementId);
  if (!entry) return null;
  return {
    elementId: entry.elementId,
    elementType: entry.elementType,
    label: entry.label,
    context: entry.context,
  };
}
