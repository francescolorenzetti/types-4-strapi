const fs = require('fs');
const { pascalCase, isOptional } = require('./utils');

module.exports = (schemaPath, interfaceName) => {
  var tsImports = [];
  var tsInterface = `\n`;
  tsInterface += `export interface ${interfaceName} {\n`;
  tsInterface += `  id: number;\n`;
  var schemaFile;
  var schema;
  try {
    schemaFile = fs.readFileSync(schemaPath, 'utf8');
    schema = JSON.parse(schemaFile);
  } catch (e) {
    console.log(`Skipping ${schemaPath}: could not parse schema`, e);
    return null;
  }
  const attributes = Object.entries(schema.attributes);
  for (const attribute of attributes) {
    var attributeName = attribute[0];
    const attributeValue = attribute[1];
    if (isOptional(attributeValue)) attributeName += '?';
    var tsType;
    var tsProperty;
    // -------------------------------------------------
    // Relation
    // -------------------------------------------------
    if (attributeValue.type === 'relation') {
      tsType = attributeValue.target.includes('::user')
        ? 'User'
        : `${pascalCase(attributeValue.target.split('.')[1])}`;
      const tsImportPath = `../${tsType}`;
      if (tsImports.every((x) => x.path !== tsImportPath))
        tsImports.push({
          type: tsType,
          path: tsImportPath,
        });
      const isArray = attributeValue.relation === 'oneToMany';
      const bracketsIfArray = isArray ? '[]' : '';
      tsProperty = `  ${attributeName}: { data: ${tsType}${bracketsIfArray} } | number${bracketsIfArray};\n`;
    }
    // -------------------------------------------------
    // Component
    // -------------------------------------------------
    else if (attributeValue.type === 'component') {
      tsType =
        attributeValue.target === 'plugin::users-permissions.user'
          ? 'User'
          : pascalCase(attributeValue.component.split('.')[1]);
      var tsImportPath = `./${tsType}`;
      if (tsImports.every((x) => x.path !== tsImportPath))
        tsImports.push({
          type: tsType,
          path: tsImportPath,
        });
      const isArray = attributeValue.repeatable;
      const bracketsIfArray = isArray ? '[]' : '';
      tsProperty = `  ${attributeName}: ${tsType}${bracketsIfArray};\n`;
    }
    // -------------------------------------------------
    // Media
    // -------------------------------------------------
    else if (attributeValue.type === 'media') {
      tsType = 'Media';
      const tsImportPath = '../Media';
      if (tsImports.every((x) => x.path !== tsImportPath))
        tsImports.push({
          type: tsType,
          path: tsImportPath,
        });
      tsProperty = `  ${attributeName}: { data: ${tsType}${
        attributeValue.multiple ? '[]' : ''
      } };\n`;
    }
    // -------------------------------------------------
    // Enumeration
    // -------------------------------------------------
    else if (attributeValue.type === 'enumeration') {
      const enumOptions = attributeValue.enum.map((v) => `'${v}'`).join(' | ');
      tsProperty = `  ${attributeName}: ${enumOptions};\n`;
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
      tsType = 'string';
      tsProperty = `  ${attributeName}: ${tsType};\n`;
    }
    // -------------------------------------------------
    // Json
    // -------------------------------------------------
    else if (attributeValue.type === 'json') {
      tsType = 'any';
      tsProperty = `  ${attributeName}: ${tsType};\n`;
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
      tsType = 'number';
      tsProperty = `  ${attributeName}: ${tsType};\n`;
    }
    // -------------------------------------------------
    // Date
    // -------------------------------------------------
    else if (
      attributeValue.type === 'date' ||
      attributeValue.type === 'datetime' ||
      attributeValue.type === 'time'
    ) {
      tsType = 'Date';
      tsProperty = `  ${attributeName}: ${tsType};\n`;
    }
    // -------------------------------------------------
    // Boolean
    // -------------------------------------------------
    else if (attributeValue.type === 'boolean') {
      tsType = 'boolean';
      tsProperty = `  ${attributeName}: ${tsType};\n`;
    }
    // -------------------------------------------------
    // Others
    // -------------------------------------------------
    else {
      tsType = 'any';
      tsProperty = `  ${attributeName}: ${tsType};\n`;
    }
    tsInterface += tsProperty;
  }
  tsInterface += '}';
  for (const tsImport of tsImports) {
    tsInterface =
      `import { ${tsImport.type} } from '${tsImport.path}';\n` + tsInterface;
  }
  return tsInterface;
};
