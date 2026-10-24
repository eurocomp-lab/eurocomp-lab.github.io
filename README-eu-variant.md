# EU register variant

Seven files. Nothing here overwrites your content pages except the diagram
tokenisation in step 1, which is reversible via git.

## What each file is

| File | Purpose |
|---|---|
| `tokenise-diagrams.py` | One-off. Converts hardcoded colours in the SVG diagrams to CSS variables so they follow whichever theme is active. |
| `theme.scss` | Your existing warm theme, plus the variable definitions the diagrams now need. Replaces the current file. |
| `theme-eu.scss` | The EU-register variant. New file. |
| `_quarto-eu.yml` | Config for the EU variant, including the legal page links and funding statement placeholder. New file. |
| `XX-legal-notice.qmd` | Draft legal notice (parked: not built). |
| `XX-privacy.qmd` | Draft privacy statement (parked: not built). |
| `XX-accessibility.qmd` | Draft accessibility statement (parked: not built). |

## To try it

1. Commit current work first, so the switch is reversible.

2. Copy all files into the repo folder, overwriting `theme.scss`.

3. Make the diagrams theme-aware (run once):

       python3 tokenise-diagrams.py
       rm tokenise-diagrams.py

   Check the site still looks right in the warm theme:

       quarto preview

4. Switch to the EU variant:

       mv _quarto.yml _quarto-warm.yml
       mv _quarto-eu.yml _quarto.yml
       quarto preview

5. Switch back by reversing step 4.

## Before publishing the legal pages

All three are drafts with open questions marked in the gold note boxes. The
`XX-` prefix keeps them out of the site; remove it to publish a page. In
particular:

- **Funding statement.** Confirm whether the Lab itself receives EU funding.
  If it does, the emblem and statement are required in the footer and specific
  placement rules apply. If it does not, delete the placeholder block from
  `_quarto-eu.yml`. Displaying the emblem without the funding relationship
  would misrepresent the project.
- **Data controller and contact point.** The privacy statement cannot be
  published without naming who is responsible.
- **Accessibility claim.** Do not state a compliance level before the site has
  been tested. An honest list of known gaps is more credible than an untested
  claim.

## Navbar note

`_quarto-eu.yml` uses the current page names (`04-toc.qmd`, `05-data.qmd`).
If those change again, update both config files.
