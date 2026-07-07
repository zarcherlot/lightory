interface ChangelogSection {
  title: string;
  items: string[];
}

interface ChangelogContributor {
  name: string;
  url: string;
  description: string;
}

interface ChangelogEntry {
  version: string;
  sections: ChangelogSection[];
  contributors: ChangelogContributor[];
}

/** Extract "major.minor" from a semver string (e.g. "1.1.1" → "1.1") */
export function toMajorMinor(version: string): string {
  const parts = version.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : version;
}

export const CHANGELOG_REPO_URL = 'https://github.com/zarcherlot/lightory';

export const changelogEntries: ChangelogEntry[] = [
  {
    version: '1.3',
    sections: [
      {
        title: 'Features',
        items: [
          'Lightory is now branded and packaged as an independent project',
          'Codex and OpenCode providers use Lightory-owned hook discovery paths',
          'Education role tasks can run through the selected local provider',
          'The browser app supports edit/play flows for role collaboration',
        ],
      },
      {
        title: 'Project',
        items: [
          'Repository, documentation, package metadata, and issue templates point to zarcherlot/lightory',
          'Local runtime state is stored under ~/.lightory for new installs',
        ],
      },
      {
        title: 'Credits',
        items: [
          'Lightory started from MIT-licensed Pixel Agents code and now evolves independently',
        ],
      },
    ],
    contributors: [],
  },
];
