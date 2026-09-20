# BacktestPlat interface

User-requested redesign: three primary destinations — market overview, stock directory, backtest workspace. UI/UX Pro Max searches informed the flat surfaces, semantic stock colors and readable sans typography. Generated marketing layouts and Fira recommendations do not fit this request and are not adopted. React-specific search returned no match; reuse existing Router/Query patterns.

- Self-host Inter Variable, including Latin and Vietnamese subsets. Body 16px, compact table text 13px, tabular numerals. No monospace display type.
- Off-white workspace, white panels, ink headings, restrained teal accents. Dark theme has equivalent contrast.
- Desktop left navigation; mobile three-item navigation in document flow. Active route is explicit; URLs are shareable.
- Home describes only stored symbols, never labels a subset statistic VN-Index or whole-market data. Aggregate only matching latest dates; rank the top five by volume. No invented news, live prices or performance.
- Stock directory supports search, sorting and deep-linked historical detail.
- Backtest is a clearly marked preparation workspace. Save a local draft; do not simulate returns or start Phase 2 engine work.
- Charts have textual descriptions and tables. Direction also uses signs/text, never color alone.
- All pages: loading, failure with retry, empty state, visible keyboard focus, reduced-motion support, 375/768/1024/1440px verification.
