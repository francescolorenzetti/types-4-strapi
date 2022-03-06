var fs = require('fs');

const typesDir = 'types';

if (!fs.existsSync(typesDir))
    fs.mkdirSync(typesDir);

// --------------------------------------------
// IUser
// --------------------------------------------

const userTsInterface =
`export interface IUser {
  id: number;
  username: string;
  email: string;
  provider: string;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}`;

fs.writeFileSync(`${typesDir}/IUser.ts`, userTsInterface);

// --------------------------------------------
// INestedUser (when User is a child of another entity)
// --------------------------------------------

const nestedUserTsInterface = 
`export interface INestedUser {
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

fs.writeFileSync(`${typesDir}/INestedUser.ts`, nestedUserTsInterface);

// --------------------------------------------
// IMediaFormat
// --------------------------------------------

var mediaFormatTsInterface = 
`export interface IMediaFormat {
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

fs.writeFileSync(`${typesDir}/IMediaFormat.ts`, mediaFormatTsInterface);

// --------------------------------------------
// IMedia
// --------------------------------------------

var mediaTsInterface = 
`import { IMediaFormat } from './IMediaFormat';

export interface IMedia {
  id: number;
  attributes: {
    name: string;
    alternativeText: string;
    caption: string;
    width: number;
    height: number;
    formats: { thumbnail: IMediaFormat; medium: IMediaFormat; small: IMediaFormat; };
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

fs.writeFileSync(`${typesDir}/IMedia.ts`, mediaTsInterface);

// --------------------------------------------
// API Types
// --------------------------------------------

var root = fs.readdirSync('./src/api').filter(x => !x.startsWith('.'));

for (const path of root) {
    var tsImports = [];
    var tsInterface = `\n`;
    tsInterface += `export interface I${formatPath(path)} {\n`;
    tsInterface += `  id: number;\n`;
    tsInterface += `  attributes: {\n`;
    var schemaFile;
    try {
        schemaFile = fs.readFileSync(`./src/api/${path}/content-types/${path}/schema.json`, 'utf8');
        var schema = JSON.parse(schemaFile);
    }
    catch (e) {
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
            type = value.target === 'plugin::users-permissions.user' ?
                'INestedUser' :
                `I${formatPath(value.target.split('.')[1])}`;
            if (tsImports.every(x => x !== type)) tsImports.push(type);
            const isArray = value.relation === 'oneToMany';
            tsProperty = `    ${key}: { data: ${type}${isArray ? '[]' : ''} };\n`;
        }
        else if (type === 'media') {
            type = 'IMedia';
            if (tsImports.every(x => x !== type)) tsImports.push(type);
            tsProperty = `    ${key}: { data: ${type}${value.multiple ? '[]' : ''} };\n`;
        }
        else if (type === 'enumeration' || type === 'richtext' || type === 'email') {
            type = 'string';
            tsProperty = `    ${key}: ${type};\n`;
        }
        else if (type === 'json') {
            type = 'any';
            tsProperty = `    ${key}: ${type};\n`;
        }
        else if (type === 'password') {
            tsProperty = '';
        }
        else {
            tsProperty = `    ${key}: ${type};\n`;
        }
        tsInterface += tsProperty;
    }
    tsInterface += `  }\n`;
    tsInterface += '}'
    for (const tsImport of tsImports) {
        tsInterface = `import { ${tsImport} } from './${tsImport}';\n` + tsInterface;
    }
    fs.writeFileSync(`${typesDir}/I${formatPath(path)}.ts`, tsInterface);
}

function formatPath(str) {
  const words = str.match(/[a-z]+/gi);
  if (!words) return;
  return words
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    })
    .join('');
}
