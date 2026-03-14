/**
 * @type {import('semantic-release').GlobalConfig}
 */
const config = {
  branches: ['main'],
  preset: 'conventionalcommits',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'chore', release: 'patch' },
          { type: 'docs', release: 'patch' },
          { type: 'style', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'test', release: 'patch' },
          { breaking: true, release: 'major' },
        ],
      },
    ],

    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'chore', section: 'Chore' },
            { type: 'docs', section: 'Docs' },
            { type: 'style', section: 'Style' },
            { type: 'refactor', section: 'Refactoring' },
            { type: 'perf', section: 'Perf' },
            { type: 'test', section: 'Tests' },
          ],
        },
      },
    ],

    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],

    [
      '@semantic-release/npm',
      {
        npmPublish: true,
      },
    ],

    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'docs/*.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],

    '@semantic-release/github',
  ],
}

export default config
