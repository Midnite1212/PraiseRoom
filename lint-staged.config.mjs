import { lstatSync } from 'node:fs';
import path from 'node:path';

const isNewUi = (file) => path.relative(process.cwd(), file).split(path.sep)[0] === 'ui';
const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');

// Run from ui/ with its own binaries: type-aware oxlint finds tsgolint there, and the hook
// does not depend on which pnpm version is on PATH.
const inUi = (command) => `sh -c 'cd ui && node_modules/.bin/${command} "$@"' ${command.split(' ')[0]}`;
const OXFMT = inUi('oxfmt --no-error-on-unmatched-pattern');
const OXLINT = inUi('oxlint --type-aware --deny-warnings');

// CLAUDE.md files are symlinks to AGENTS.md; Prettier refuses symlinks and the target is formatted anyway.
const isSymlink = (file) => lstatSync(file).isSymbolicLink();

const byPackage = (stagedFiles, legacyCommands, newUiCommands) => {
  const files = stagedFiles.filter((file) => !isSymlink(file));
  const legacy = files.filter((file) => !isNewUi(file));
  const newUi = files.filter(isNewUi);
  return [
    ...(legacy.length > 0 ? legacyCommands(quote(legacy)) : []),
    ...(newUi.length > 0 ? newUiCommands(quote(newUi)) : []),
  ];
};

export default {
  '**/*.{js,jsx,ts,tsx}': (files) =>
    byPackage(
      files,
      (list) => [
        `prettier --write --config .prettierrc.json ${list}`,
        `eslint --max-warnings=0 ${list}`,
      ],
      (list) => [`${OXFMT} ${list}`, `${OXLINT} ${list}`]
    ),
  '**/*.{json,md,css}': (files) =>
    byPackage(
      files,
      (list) => [`prettier --write --config .prettierrc.json ${list}`],
      (list) => [`${OXFMT} ${list}`]
    ),
};
