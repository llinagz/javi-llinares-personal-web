# AGENTS.md

Project: Javi Llinares

## Framework decision

Build this as an Astro content-first personal website.

This is not a web application.
It is a personal editorial hub for:
- Blog articles
- Software projects
- Essays
- Personal brand content

Astro is preferred because the website should be:
- Mostly static
- Fast
- SEO-friendly
- Easy to maintain
- Easy to publish content for
- Minimal in client-side JavaScript
- Editorial and content-driven

Use Astro Content Collections for:
- Blog posts
- Projects

Only add client-side islands when genuinely necessary.

Do not turn the site into a SPA.

## Brand and design

Primary color:
#16524e

Tone:
- Editorial
- Calm
- Technical
- Human
- Thoughtful
- Non-corporate

Avoid:
- Generic SaaS layouts
- Heavy shadows
- Excessive animation
- Startup-style marketing sections

## Code quality

- TypeScript
- Clean architecture where useful
- Small reusable components
- Avoid over-engineering
- Run lint/build before finishing
