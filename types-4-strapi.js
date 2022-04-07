#!/usr/bin/env node

var fs = require('fs');

const typesDir = 'types';

if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir);

// --------------------------------------------
// Payload
// --------------------------------------------

const payloadTsInterface = `export interface Payload<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  };
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
  const isComponentSchema = schemaPath.includes('src/components/');
  const attributes = Object.entries(schema.attributes);
  for (const attribute of attributes) {
    var attributeName = attribute[0];
    const attributeValue = attribute[1];
    const optional = attributeValue.required === false;
    if (optional) attributeName += '?';
    var tsPropertyType;
    var tsProperty;
    // -------------------------------------------------
    // Relation
    // -------------------------------------------------
    if (attributeValue.type === 'relation') {
      tsPropertyType = attributeValue.target.includes('::user')
        ? 'User'
        : `${pascalCase(attributeValue.target.split('.')[1])}`;
      var path = isComponentSchema
        ? `../${tsPropertyType}` // component imports api type
        : `./${tsPropertyType}`; // api type imports api type
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type: tsPropertyType,
          path,
        });
      const isArray = attributeValue.relation === 'oneToMany';
      const bracketsIfArray = isArray ? '[]' : '';
      tsProperty = `    ${attributeName}: { data: ${tsPropertyType}${bracketsIfArray} } | number${bracketsIfArray};\n`;
    }
    // -------------------------------------------------
    // Component
    // -------------------------------------------------
    else if (attributeValue.type === 'component') {
      tsPropertyType =
        attributeValue.target === 'plugin::users-permissions.user'
          ? 'User'
          : pascalCase(attributeValue.component.split('.')[1]);
      var path = isComponentSchema
        ? `./${tsPropertyType}` // ........... component imports component
        : `./components/${tsPropertyType}`; // api type imports component
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type: tsPropertyType,
          path,
        });
      const isArray = attributeValue.repeatable;
      const bracketsIfArray = isArray ? '[]' : '';
      tsProperty = `    ${attributeName}: { data: ${tsPropertyType}${bracketsIfArray} } | number${bracketsIfArray};\n`;
    }
    // -------------------------------------------------
    // Media
    // -------------------------------------------------
    else if (attributeValue.type === 'media') {
      tsPropertyType = 'Media';
      path = isComponentSchema ? '../Media' : './Media';
      if (tsImports.every((x) => x.path !== path))
        tsImports.push({
          type: tsPropertyType,
          path,
        });
      tsProperty = `    ${attributeName}: { data: ${tsPropertyType}${
        attributeValue.multiple ? '[]' : ''
      } };\n`;
    }
    // -------------------------------------------------
    // Dynamic zone
    // -------------------------------------------------
    else if (attributeValue.type === 'dynamiczone') {
      tsPropertyType = 'any';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }

    // -------------------------------------------------
    // Enumeration
    // -------------------------------------------------
    else if (attributeValue.type === 'enumeration') {
      const enumOptions = attributeValue.enum.map((v) => `'${v}'`).join(' | ');
      tsProperty = `    ${attributeName}: ${enumOptions};\n`;
    }
    // -------------------------------------------------
    // Text, RichText, Email, UID
    // -------------------------------------------------
    else if (
      attributeValue.type === 'string' ||
      attributeValue.type === 'text' ||
      attributeValue.type === 'richtext' ||
      attributeValue.type === 'email' ||
      attributeValue.type === 'uid'
    ) {
      tsPropertyType = 'string';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Json
    // -------------------------------------------------
    else if (attributeValue.type === 'json') {
      tsPropertyType = 'any';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Password
    // -------------------------------------------------
    else if (attributeValue.type === 'password') {
      tsProperty = '';
    }
    // -------------------------------------------------
    // Number
    // -------------------------------------------------
    else if (
      attributeValue.type === 'integer' ||
      attributeValue.type === 'biginteger' ||
      attributeValue.type === 'decimal' ||
      attributeValue.type === 'float'
    ) {
      tsPropertyType = 'number';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Date
    // -------------------------------------------------
    else if (
      attributeValue.type === 'date' ||
      attributeValue.type === 'datetime' ||
      attributeValue.type === 'time'
    ) {
      tsPropertyType = 'Date';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
    }
    // -------------------------------------------------
    // Others
    // -------------------------------------------------
    else {
      tsPropertyType = 'any';
      tsProperty = `    ${attributeName}: ${tsPropertyType};\n`;
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
