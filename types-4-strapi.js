#!/usr/bin/env node

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

fs.writeFileSync(`${typesDir}/User.ts`, userTsInterface);

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

var apiFolders;
try {
  apiFolders = fs.readdirSync('./src/api').filter((x) => !x.startsWith('.'));
} catch (e) {
  console.log('No API types found. Skipping...');
}

if (apiFolders)
  for (const apiFolder of apiFolders) {
    const interfaceName = pascalCase(apiFolder);
    const interface = createInterface(
      `./src/api/${apiFolder}/content-types/${apiFolder}/schema.json`,
      interfaceName
    );
    if (interface)
      fs.writeFileSync(`${typesDir}/${interfaceName}.ts`, interface);
  }

// --------------------------------------------
// Components
// --------------------------------------------

var componentCategoryFolders;
try {
  componentCategoryFolders = fs.readdirSync('./src/components');
} catch (e) {
  console.log('No Component types found. Skipping...');
}

if (componentCategoryFolders) {
  const targetFolder = 'types/components';

  if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

  for (const componentCategoryFolder of componentCategoryFolders) {
    var componentSchemas = fs.readdirSync(
      `./src/components/${componentCategoryFolder}`
    );
    for (const componentSchema of componentSchemas) {
      const interfaceName = pascalCase(componentSchema.replace('.json', ''));
      const interface = createInterface(
        `./src/components/${componentCategoryFolder}/${componentSchema}`,
        interfaceName
      );
      if (interface)
        fs.writeFileSync(`${targetFolder}/${interfaceName}.ts`, interface);
    }
  }
}

// --------------------------------------------
// Utils
// --------------------------------------------

function pascalCase(str) {
  if (!str) return;
  const words = str.match(/[a-z]+/gi);
  return words
    .map(
      (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
    )
    .join('');
}

function createInterface(schemaPath, interfaceName) {
  var tsImports = [];
  var tsInterface = `\n`;
  tsInterface += `export interface ${interfaceName} {\n`;
  tsInterface += `  id: number;\n`;
  tsInterface += `  attributes: {\n`;
  var schemaFile;
  var schema;
  try {
    schemaFile = fs.readFileSync(schemaPath, 'utf8');
    schema = JSON.parse(schemaFile);
  } catch (e) {
    console.log(`Skipping ${schemaPath}: could not parse schema`);
    return null;
  }
  const attributes = Object.entries(schema.attributes);
  for (const attribute of attributes) {
    const attributeName = attribute[0];
    const attributeValue = attribute[1];
    var type = attributeValue.type;
    var tsProperty;
    // -------------------------------------------------
    // Relation
    // -------------------------------------------------
    if (type === 'relation') {
      type =
        attributeValue.target === 'plugin::users-permissions.user'
          ? 'User'
          : `${pascalCase(attributeValue.target.split('.')[1])}`;
      var path = schema.kind === 'collectionType' ? `./${type}` : `../${type}`;
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type,
          path,
        });
      const isArray = attributeValue.relation === 'oneToMany';
      tsProperty = `    ${attributeName}: { data: ${type}${
        isArray ? '[]' : ''
      } } | number;\n`;
    }
    // -------------------------------------------------
    // Component
    // -------------------------------------------------
    else if (type === 'component') {
      type =
        attributeValue.target === 'plugin::users-permissions.user'
          ? 'User'
          : pascalCase(attributeValue.component.split('.')[1]);
      var path =
        schema.kind === 'collectionType' ? `./components/${type}` : `./${type}`;
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type,
          path,
        });
      const isArray = attributeValue.repeatable;
      tsProperty = `    ${attributeName}: { data: ${type}${
        isArray ? '[]' : ''
      } } | number;\n`;
    } else if (type === 'media') {
      type = 'Media';
      path = './Media';
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type,
          path,
        });
      tsProperty = `    ${attributeName}: { data: ${type}${
        attributeValue.multiple ? '[]' : ''
      } };\n`;
    }
    // -------------------------------------------------
    // Enumeration, RichText, Email
    // -------------------------------------------------
    else if (
      type === 'enumeration' ||
      type === 'richtext' ||
      type === 'email'
    ) {
      type = 'string';
      tsProperty = `    ${attributeName}: ${type};\n`;
    }
    // -------------------------------------------------
    // Json
    // -------------------------------------------------
    else if (type === 'json') {
      type = 'any';
      tsProperty = `    ${attributeName}: ${type};\n`;
    }
    // -------------------------------------------------
    // Password
    // -------------------------------------------------
    else if (type === 'password') {
      tsProperty = '';
    }
    // -------------------------------------------------
    // Number
    // -------------------------------------------------
    else if (type === 'integer' || type === 'decimal' || type === 'float') {
      type = 'number';
      tsProperty = `    ${attributeName}: ${type};\n`;
    } else {
      tsProperty = `    ${attributeName}: ${type};\n`;
    }
    tsInterface += tsProperty;
  }
  tsInterface += `  }\n`;
  tsInterface += '}';
  for (const tsImport of tsImports) {
    tsInterface =
      `import { ${tsImport.type} } from '${tsImport.path}';\n` + tsInterface;
  }
  return tsInterface;
}
