(() => {
  const titleIcons = [
    [/\b(wallet|coin purse)\b|\bpurse\b/i, 'fa-wallet'],
    [/\b(umbrella|parasol)\b/i, 'fa-umbrella'],
    [/\b(phone|smartphone|mobile)\b/i, 'fa-mobile-screen-button'],
    [/\b(mouse|mousepad|mouse pad)\b/i, 'fa-computer-mouse'],
    [/\b(keyboard|keypad)\b/i, 'fa-keyboard'],
    [/\b(book|notebook|textbook|journal)\b/i, 'fa-book'],
    [/\b(key|keys|keychain)\b/i, 'fa-key'],
    [/\b(id|identification card|student card|license|passport|document)\b/i, 'fa-id-card'],
    [/\b(laptop|computer|tablet)\b/i, 'fa-laptop'],
    [/\b(bag|backpack|tote)\b/i, 'fa-briefcase'],
    [/\b(watch|clock)\b/i, 'fa-clock'],
    [/\b(earbud|headphone|earphone)\b/i, 'fa-headphones'],
    [/\b(charger|cable|adapter)\b/i, 'fa-plug'],
    [/\b(bottle|tumbler|flask)\b/i, 'fa-bottle-water'],
    [/\b(glasses|sunglasses|eyeglasses)\b/i, 'fa-glasses'],
    [/\b(shirt|jacket|coat|hoodie|uniform|clothing)\b/i, 'fa-shirt'],
    [/\b(shoe|sneaker|footwear|sandal)\b/i, 'fa-shoe-prints']
  ];

  const categoryIcons = [
    [/electronic|computer|mobile|device/i, 'fa-mobile-screen-button'],
    [/document|\bid\b|identification/i, 'fa-id-card'],
    [/book|stationery/i, 'fa-book'],
    [/key/i, 'fa-key'],
    [/bag|luggage/i, 'fa-briefcase'],
    [/cloth|apparel/i, 'fa-shirt'],
    [/accessor/i, 'fa-glasses']
  ];

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[char]);
  }

  function iconClass(title, category) {
    const titleText = String(title || '');
    const matchedTitle = titleIcons.find(([pattern]) => pattern.test(titleText));
    if (matchedTitle) return matchedTitle[1];

    const categoryText = String(category || '');
    const matchedCategory = categoryIcons.find(([pattern]) => pattern.test(categoryText));
    return matchedCategory?.[1] || 'fa-box';
  }

  function icon(title, category) {
    return `<i class="fa-solid ${iconClass(title, category)}" aria-hidden="true"></i>`;
  }

  function markup(title, category, type, options = {}) {
    const isFound = String(type || '').toLowerCase() === 'found';
    const gradient = isFound
      ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)'
      : 'linear-gradient(135deg,#dbeafe,#bfdbfe)';
    const minHeight = Number(options.minHeight) > 0 ? `min-height:${Math.round(Number(options.minHeight))}px;` : '';
    const fontSize = Number(options.fontSize) > 0 ? Math.round(Number(options.fontSize)) : 48;
    const label = title ? `Default illustration for ${title}` : `Default ${category || 'item'} illustration`;

    return `<div style="width:100%;height:100%;${minHeight}background:${gradient};display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;color:#111827;" role="img" aria-label="${escapeHtml(label)}">${icon(title, category)}</div>`;
  }

  window.ASAItemPlaceholder = Object.freeze({ icon, markup });
})();
