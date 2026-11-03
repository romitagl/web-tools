# Home page and navigation review

The local implementation proposes a task-first directory for all nine current tools. Existing tool URLs are preserved.

## Proposed structure

1. Shared header: brand, All tools, and a Browse tools disclosure on every route. The menu groups every tool by task and marks Website Scraper as beta. Current tool links receive an active state.
2. Short introduction: clear purpose and one link to the directory. A GIF Maker spotlight shows both image and video input; it is editorial, not a claim about measured popularity.
3. Compact benefits strip: local file processing, free access, no account, and open source.
4. Searchable directory: All tools, Documents (2), Media (2), QR codes (1), Developer & network (4). Each tool appears once with a concise description and capability tags.
5. Privacy explanation: local document/media processing, optional camera access for QR scanning, and the scraper's network/proxy exception.
6. Compact footer: directory, source repository, and sponsorship.

Desktop uses a two-column introduction and up to three tool cards per row. Mobile stacks the introduction, wraps filters, and uses one card per row. The tool menu stays in normal page flow and works with keyboard navigation.

## Suggested next decisions

- Keep the GIF spotlight, rotate it manually as tools change, or remove it for a shorter home page.
- If the catalog grows, split Developer & network into separate categories. Four categories currently keep navigation compact.
- Consider adding a “Recently used” section only if wanted. It would require storing usage on the device; this implementation stores no usage history.

## Maintenance

`src/toolCatalog.js` supplies directory content, navigation links, counts, and the static route generator. Add catalog entries when adding tools; tool components and SEO still require their own route metadata. The reviewed catalog and navigation changes are approved for release.
