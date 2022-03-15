var fs = require('fs');

const typesDir = 'types';

if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir);

// --------------------------------------------
// Payload
// --------------------------------------------

const payloadTsInterface = `export interface Payload<T> {
  data: T;
  meta?: any;
}`;

fs.writeFileSync(`${typesDir}/Payload.ts`, payloadTsInterface);

// --------------------------------------------
// User
// --------------------------------------------

const userTsInterface = `export interface User {
  id: number;
  username: string;
  email: string;
  provider: string;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}`;

fs.writeFileSync(`${typesDir}/User.ts`, userTsInterface);

// --------------------------------------------
// NestedUser (when User is a child of another entity)
// --------------------------------------------

const nestedUserTsInterface = `export interface NestedUser {
  id: number;
  attributes: {
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
}`;

fs.writeFileSync(`${typesDir}/NestedUser.ts`, nestedUserTsInterface);

// --------------------------------------------
// MediaFormat
// --------------------------------------------

var mediaFormatTsInterface = `export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path: string;
  url: string;
}`;

fs.writeFileSync(`${typesDir}/MediaFormat.ts`, mediaFormatTsInterface);

// --------------------------------------------
// Media
// --------------------------------------------

var mediaTsInterface = `import { MediaFormat } from './MediaFormat';

export interface Media {
  id: number;
  attributes: {
    name: string;
    alternativeText: string;
    caption: string;
    width: number;
    height: number;
    formats: { thumbnail: MediaFormat; medium: MediaFormat; small: MediaFormat; };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
  }
}`;

fs.writeFileSync(`${typesDir}/Media.ts`, mediaTsInterface);

// --------------------------------------------
// API Types
// --------------------------------------------

var root = fs.readdirSync('./src/api').filter((x) => !x.startsWith('.'));

for (const path of root) {
  var tsImports = [];
  var tsInterface = `\n`;
  tsInterface += `export interface ${formatPath(path)} {\n`;
  tsInterface += `  id: number;\n`;
  tsInterface += `  attributes: {\n`;
  var schemaFile;
  try {
    schemaFile = fs.readFileSync(
      `./src/api/${path}/content-types/${path}/schema.json`,
      'utf8'
    );
    var schema = JSON.parse(schemaFile);
  } catch (e) {
    console.log(`Skipping ${path} folder: could not parse schema.json`);
    continue;
  }
  const attributes = Object.entries(schema.attributes);
  for (const attribute of attributes) {
    const key = attribute[0];
    const value = attribute[1];
    var type = value.type;
    var tsProperty;
    if (type === 'relation') {
      type =
        value.target === 'plugin::users-permissions.user'
          ? 'NestedUser'
          : `${formatPath(value.target.split('.')[1])}`;
      if (tsImports.every((x) => x !== type)) tsImports.push(type);
      const isArray = value.relation === 'oneToMany';
      tsProperty = `    ${key}: { data: ${type}${
        isArray ? '[]' : ''
      } } | number;\n`;
    } else if (type === 'component') {
      // TODO: create dedicated types for components
      type = 'any';
      tsProperty = `    ${key}: ${type};\n`;
    } else if (type === 'media') {
      type = 'Media';
      if (tsImports.every((x) => x !== type)) tsImports.push(type);
      tsProperty = `    ${key}: { data: ${type}${
        value.multiple ? '[]' : ''
      } };\n`;
    } else if (
      type === 'enumeration' ||
      type === 'richtext' ||
      type === 'email'
    ) {
      type = 'string';
      tsProperty = `    ${key}: ${type};\n`;
    } else if (type === 'json') {
      type = 'any';
      tsProperty = `    ${key}: ${type};\n`;
    } else if (type === 'password') {
      tsProperty = '';
    } else if (type === 'integer' || type === 'decimal' || type === 'float') {
      type = 'number';
      tsProperty = `    ${key}: ${type};\n`;
    } else {
      tsProperty = `    ${key}: ${type};\n`;
    }
    tsInterface += tsProperty;
  }
  tsInterface += `  }\n`;
  tsInterface += '}';
  for (const tsImport of tsImports) {
    tsInterface =
      `import { ${tsImport} } from './${tsImport}';\n` + tsInterface;
  }
  fs.writeFileSync(`${typesDir}/${formatPath(path)}.ts`, tsInterface);
}

// --------------------------------------------
// Utils
// --------------------------------------------

function formatPath(str) {
  const words = str.match(/[a-z]+/gi);
  if (!words) return;
  return words
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    })
    .join('');
}
