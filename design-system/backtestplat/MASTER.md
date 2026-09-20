# BacktestPlat interface

User-requested redesign: three primary destinations — market overview, stock directory, backtest workspace. UI/UX Pro Max searches informed the flat surfaces, semantic stock colors and readable sans typography. Generated marketing layouts and Fira recommendations do not fit this request and are not adopted. React-specific search returned no match; reuse existing Router/Query patterns.

- Self-host Inter Variable, including Latin and Vietnamese subsets. Body 16px, compact table text 13px, tabular numerals. No monospace display type.
- Light theme: ice-blue to lavender workspace, near-white blended panels, navy text and blue/violet accents. Keep positive/negative data colors green/red.
- Dark theme: sci-fi research console with midnight navy surfaces, ice-cyan interaction/chart accents and lavender secondary details. Use subtle static ambient gradients, no decorative background grid and restrained glow; keep text crisp and positive/negative colors green/rose. Financial Dashboard search informed the dark surface hierarchy; cyan/lavender styling follows the user's explicit sci-fi direction. Preserve contrast and reduced-motion behavior.
- Both themes use semantic gradient tokens for surfaces, selected navigation, primary actions and volume bars. Price lines blend blue/cyan into violet using an SVG gradient with user-space coordinates so flat series remain visible. Ambient effects are static; typography stays solid-color for legibility.
- Desktop left navigation; mobile three-item navigation in document flow. Active route is explicit; URLs are shareable.
- Home describes only stored symbols, never labels a subset statistic VN-Index or whole-market data. Aggregate only matching latest dates; rank the top five by volume. No invented news, live prices or performance.
- Stock directory supports search, sorting and deep-linked historical detail.
- Backtest is a clearly marked preparation workspace. Save a local draft; do not simulate returns or start Phase 2 engine work.
- Charts have textual descriptions and tables. Direction also uses signs/text, never color alone.
- All pages: loading, failure with retry, empty state, visible keyboard focus, reduced-motion support, 375/768/1024/1440px verification.

- Theme control: compact bordered button with only Light/Dark; an opaque dropdown anchors 8px below the button. Persist the choice; legacy System settings resolve to Light. Keep contrast, arrow-key navigation, Escape/focus restoration and outside-dismiss behavior.
- Historical detail uses TradingView Lightweight Charts with 1D/1W/1M/1Y OHLC aggregation, right price scale, bottom time axis, separate volume pane and crosshair readout. Pan/zoom with pointer/touch or buttons, inspect all bars with an accessible range control. Keep chart grid disabled; preserve the selected viewport when changing theme.
- Chart references: [Binance TradingView guide](https://www.binance.com/en/support/faq/detail/8419126024404348a1c6e4039fbed3fe) and [TradingView Lightweight Charts](https://www.tradingview.com/lightweight-charts/). Adopt the functional hierarchy without exchange branding or fabricated market data.
