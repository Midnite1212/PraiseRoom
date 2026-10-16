import path from 'node:path';

const isNewUi = (file) => path.relative(process.cwd(), file).split(path.sep)[0] === 'ui';
const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');
const newUiFiles = (files) =>
  quote(files.filter(isNewUi).map((file) => path.relative(path.resolve('ui'), file)));

const byPackage = (files, legacyCommands, newUiCommands) => {
  const legacy = files.filter((file) => !isNewUi(file));
  const newUi = files.filter(isNewUi);
  return [
    ...(legacy.length > 0 ? legacyCommands(quote(legacy)) : []),
    ...(newUi.length > 0 ? newUiCommands(newUiFiles(newUi)) : []),
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
      (list) => [
        `pnpm --dir ui exec oxfmt ${list}`,
        `pnpm --dir ui exec oxlint --deny-warnings ${list}`,
      ]
    ),
  '**/*.{json,md,css}': (files) =>
    byPackage(
      files,
      (list) => [`prettier --write --config .prettierrc.json ${list}`],
      (list) => [`pnpm --dir ui exec oxfmt ${list}`]
    ),
};
