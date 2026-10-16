import { lstatSync } from 'node:fs';
import path from 'node:path';

const LINT_ARGS = {
  ui: '--type-aware --deny-warnings',
  server: '--type-aware --deny-warnings',
  'old-ui': '--deny-warnings',
  '.': '--deny-warnings',
};

const packageOf = (file) => {
  const top = path.relative(process.cwd(), file).split(path.sep)[0];
  return top in LINT_ARGS ? top : '.';
};

// Run inside each package with its own binaries and config; type-aware oxlint finds tsgolint there.
const inPackage = (dir, binary, args, files) =>
  `sh -c 'cd ${dir} && node_modules/.bin/${binary} ${args} "$@"' ${binary} ${files
    .map((file) => JSON.stringify(file))
    .join(' ')}`;

// CLAUDE.md files are symlinks to AGENTS.md, which is formatted anyway.
const isSymlink = (file) => lstatSync(file).isSymbolicLink();

const byPackage = (stagedFiles, commandsFor) => {
  const groups = Map.groupBy(
    stagedFiles.filter((file) => !isSymlink(file)),
    packageOf
  );
  return [...groups].flatMap(([dir, files]) => commandsFor(dir, files));
};

export default {
  '**/*.{js,jsx,ts,tsx,mjs,cjs}': (files) =>
    byPackage(files, (dir, list) => [
      inPackage(dir, 'oxfmt', '--no-error-on-unmatched-pattern', list),
      inPackage(dir, 'oxlint', LINT_ARGS[dir], list),
    ]),
  '**/*.{json,md,css,yml,yaml}': (files) =>
    byPackage(files, (dir, list) => [
      inPackage(dir, 'oxfmt', '--no-error-on-unmatched-pattern', list),
    ]),
};
