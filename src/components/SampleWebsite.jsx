import { useState } from 'react';
import { COLOR_VALUES } from '../utils/patchUtils.js';

function getColor(value) {
  return COLOR_VALUES[value] ?? (/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value) ? value : undefined);
}

function styleFor(values) {
  return {
    backgroundColor: getColor(values.backgroundColor),
    color: getColor(values.color),
    fontSize: values.fontSize,
    borderRadius: values.borderRadius,
    borderColor: getColor(values.borderColor),
    borderWidth: values.borderWidth,
    padding: values.padding,
    textAlign: values.textAlign,
    marginTop: values.marginTop,
    display: values.visibility === 'hidden' ? 'none' : undefined,
  };
}

export function SampleWebsite({
  websiteState,
  selectedTarget,
  selectionMode,
  onSelectTarget,
  layoutShifted,
  onToggleLayout,
  onSimulateUpstreamChange,
  onSimulateElementIdChange,
  showControls = true,
}) {
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const button = websiteState['buy-now-button'];
  const product = websiteState['product-card'];

  const selectContainer = (target) => (event) => {
    if (!selectionMode) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectTarget(target);
  };

  function selectElement(target) {
    return (event) => {
      if (!selectionMode) return;
      event.preventDefault();
      event.stopPropagation();
      onSelectTarget(target);
    };
  }

  const productCard = (
    <article
      data-patch-target="product-card"
      data-patch-semantic="Studio One product card"
      data-patch-container="product-card"
      aria-label="Studio One product card"
      data-patch-layout={product.layout}
      className={`product-card layout-${product.layout} ${selectedTarget === 'product-card' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
      style={styleFor(product)}
      onClick={selectElement('product-card')}
    >
      <div className="product-image-wrap" data-patch-container="product-image-wrap">
        <img
          data-patch-target="product-image"
          data-patch-semantic="Studio One product image"
          src={websiteState['product-image'].imageSource}
          alt={`${websiteState['product-title'].textContent} headphones`}
          className={`${selectedTarget === 'product-image' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
          style={{ borderRadius: websiteState['product-image'].borderRadius, display: websiteState['product-image'].visibility === 'hidden' ? 'none' : undefined }}
          onClick={selectElement('product-image')}
        />
        <span className="product-tag">BESTSELLER</span>
      </div>
      <div className="product-info" data-patch-container="product-info">
        <div>
          <p className="product-category">WIRELESS HEADPHONES</p>
          <h3
            data-patch-target="product-title"
            data-patch-semantic="Studio One product title"
              className={`${selectedTarget === 'product-title' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
            style={{ color: getColor(websiteState['product-title'].color), fontSize: websiteState['product-title'].fontSize }}
            onClick={selectElement('product-title')}
          >{websiteState['product-title'].textContent}</h3>
          <p
            data-patch-target="product-description"
            data-patch-semantic="Studio One product description"
            className={`product-subtitle ${selectedTarget === 'product-description' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
            style={{ color: getColor(websiteState['product-description'].color), fontSize: websiteState['product-description'].fontSize }}
            onClick={selectElement('product-description')}
          >{websiteState['product-description'].textContent}</p>
        </div>
        <strong
          data-patch-target="product-price"
          data-patch-semantic="Studio One product price"
          className={`product-price ${selectedTarget === 'product-price' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
          style={{ color: getColor(websiteState['product-price'].color), fontSize: websiteState['product-price'].fontSize }}
          onClick={selectElement('product-price')}
        >{websiteState['product-price'].textContent}</strong>
      </div>
      <button
        data-patch-target="buy-now-button"
        data-patch-semantic="Studio One purchase action"
        data-patch-behavior={button.behavior}
        aria-label={`${button.textContent}, Studio One headphones`}
        className={`buy-button ${selectedTarget === 'buy-now-button' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
        style={styleFor(button)}
        onClick={(event) => {
          if (selectionMode) selectElement('buy-now-button')(event);
          else if (button.behavior === 'add-to-bag') {
            setPurchaseCount((count) => count + 1);
            setPurchaseMessage('Studio One added to your bag.');
          } else {
            setPurchaseMessage('We’ll notify you when Studio One is available.');
          }
        }}
      >
        <span className="button-copy">{button.textContent}</span><span aria-hidden="true">↗</span>
      </button>
      <p className="purchase-feedback" data-purchase-feedback role="status">{purchaseMessage}</p>
    </article>
  );

  return (
    <section
      className={`store-panel ${selectedTarget === 'page-background' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
      data-patch-container="store-root"
      data-patch-target="page-background"
      data-patch-semantic="SONORA storefront background"
      aria-label="Live sample storefront"
      style={{ backgroundColor: getColor(websiteState['page-background'].backgroundColor) }}
      onClick={selectElement('page-background')}
    >
      <nav
        className={`store-topline ${selectedTarget === 'navigation-bar' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
        data-patch-target="navigation-bar"
        data-patch-semantic="SONORA navigation bar"
        data-patch-container="navigation-bar"
        style={{ backgroundColor: getColor(websiteState['navigation-bar'].backgroundColor), color: getColor(websiteState['navigation-bar'].color), padding: `0 ${websiteState['navigation-bar'].padding}` }}
        aria-label="Store navigation"
        onClick={selectContainer('navigation-bar')}
      >
        <span
          className="store-mark"
          style={{ color: getColor(websiteState.logo.color), fontSize: websiteState.logo.fontSize }}
          className={`logo-mark ${selectedTarget === 'logo' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
          onClick={selectElement('logo')}
        >{websiteState.logo.textContent.slice(0, 1)}</span>
        <span data-logo-copy data-patch-target="logo" data-patch-semantic="SONORA wordmark" className={`logo-copy ${selectedTarget === 'logo' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`} style={{ color: getColor(websiteState.logo.color), fontSize: websiteState.logo.fontSize }} onClick={selectElement('logo')}>{websiteState.logo.textContent}</span>
        <div className="store-nav-links" onClick={selectContainer('navigation-bar')}>
          <a href="#products" onClick={(event) => { if (selectionMode) selectContainer('navigation-bar')(event); else event.preventDefault(); }}>Shop</a>
          <a href="#about" onClick={(event) => { if (selectionMode) selectContainer('navigation-bar')(event); else event.preventDefault(); }}>Our Story</a>
        </div>
        <span className="store-bag" data-cart-count={purchaseCount}>BAG <b>{purchaseCount}</b></span>
      </nav>
      <div className="store-content" data-patch-container="store-content">
        <p
          className={`store-eyebrow ${selectedTarget === 'subheading' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
          data-patch-target="subheading"
          data-patch-semantic="SONORA storefront subheading"
          style={{ color: getColor(websiteState.subheading.color), fontSize: websiteState.subheading.fontSize, textAlign: websiteState.subheading.textAlign }}
          onClick={selectElement('subheading')}
        >{websiteState.subheading.textContent}</p>
        <h2
          data-patch-target="main-heading"
          data-patch-semantic="Sonora storefront headline"
          className={`${selectedTarget === 'main-heading' ? 'is-selected' : ''} ${selectionMode ? 'is-inspectable' : ''}`}
          style={styleFor(websiteState['main-heading'])}
          onClick={selectElement('main-heading')}
        >{websiteState['main-heading'].textContent}</h2>
        {layoutShifted ? (
          <section className="featured-rail" data-patch-container="featured-rail" aria-label="Featured product rail">{productCard}</section>
        ) : (
          <div className="product-grid" id="products" data-patch-container="product-grid">{productCard}</div>
        )}
        <p className="store-footnote">Complimentary shipping on orders over $100</p>
      </div>
      {showControls && <div className="sample-controls" onClick={(event) => event.stopPropagation()}>
        <span><i />{layoutShifted ? 'ELEMENT RELOCATED' : 'DEMO SITE'}</span>
        <button onClick={onToggleLayout}>{layoutShifted ? 'Restore layout' : 'Simulate element move'}</button>
        <button onClick={onSimulateElementIdChange}>Simulate ID change</button>
        <button onClick={onSimulateUpstreamChange}>Simulate upstream edit</button>
      </div>}
    </section>
  );
}